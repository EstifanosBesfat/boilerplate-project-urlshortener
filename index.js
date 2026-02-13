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
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    // DNS VALIDATION (required by FCC)
    dns.lookup(parsedUrl.hostname, async (err) => {
      if (err) return res.json({ error: "invalid url" });

      const count = await Url.countDocuments();
      const shortCode = count + 1;

      const newUrl = new Url({
        original_url: originalUrl,
        short_url: shortCode,
      });

      await newUrl.save();

      res.json({
        original_url: originalUrl,
        short_url: shortCode,
      });
    });
  } catch {
    res.json({ error: "invalid url" });
  }
});

/* REDIRECT */
app.get("/api/shorturl/:id", async (req, res) => {
  const id = Number(req.params.id);

  const foundUrl = await Url.findOne({ short_url: id });

  if (!foundUrl) {
    return res.json({ error: "No short URL found for given input" });
  }

  // FCC REQUIRES 301
  res.redirect(301, foundUrl.original_url);
});

/* START SERVER */
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
