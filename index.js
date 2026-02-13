require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");
const urlParser = require("url");

const app = express();

/* REQUIRED FOR RENDER + FCC */
app.set("trust proxy", true);

/* DATABASE */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error(err));

/* BASIC CONFIG */
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/hello", (req, res) => {
  res.json({ greeting: "hello API" });
});

/* MODEL */
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

/* CREATE SHORT URL */
app.post("/api/shorturl", async (req, res) => {
  const rawUrl = req.body.url;

  // parse WITHOUT modifying original string
  const parsed = urlParser.parse(rawUrl);
  if (!parsed.hostname) {
    return res.json({ error: "invalid url" });
  }

  // dns validate (FCC requirement)
  dns.lookup(parsed.hostname, { family: 4 }, async (err) => {
    if (err) return res.json({ error: "invalid url" });

    try {
      const shortCode = (await Url.countDocuments()) + 1;

      await Url.create({
        original_url: rawUrl, // store EXACT input
        short_url: shortCode,
      });

      res.json({
        original_url: rawUrl,
        short_url: shortCode,
      });
    } catch {
      res.status(500).json({ error: "server error" });
    }
  });
});

/* REDIRECT — strict FCC compliant */
app.get("/api/shorturl/:short_url", async (req, res) => {
  const id = Number(req.params.short_url);
  const urlDoc = await Url.findOne({ short_url: id });

  if (!urlDoc) {
    return res.json({ error: "No short URL found for given input" });
  }

  res.statusCode = 301;
  res.setHeader("Location", urlDoc.original_url);
  return res.end();
});

/* START SERVER */
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
