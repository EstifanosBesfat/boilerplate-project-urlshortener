require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");

const app = express();

/* IMPORTANT FOR FCC REDIRECT TEST */
app.set("trust proxy", true);

/* DB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

/* BASIC CONFIG */
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(`${process.cwd()}/public`));

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

  let hostname;

  try {
    const parsed = new URL(rawUrl);
    hostname = parsed.hostname;
  } catch {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: "invalid url" });

    try {
      const count = await Url.countDocuments();
      const shortCode = count + 1;

      await Url.create({
        original_url: rawUrl,
        short_url: shortCode,
      });

      res.json({ original_url: rawUrl, short_url: shortCode });
    } catch (e) {
      res.status(500).json({ error: "server error" });
    }
  });
});

/* REDIRECT */
app.get("/api/shorturl/:id", async (req, res) => {
  const id = Number(req.params.id);
  const foundUrl = await Url.findOne({ short_url: id });

  if (!foundUrl) {
    return res.json({ error: "No short URL found for given input" });
  }

  res.statusCode = 301;
  res.setHeader("Location", foundUrl.original_url);
  return res.end();
});

/* START SERVER */
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
