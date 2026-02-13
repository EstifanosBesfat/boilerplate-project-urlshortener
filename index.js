require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const urlParser = require("url");

const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});
const Url = mongoose.model("Url", urlSchema);

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;
  try {
    const parsedUrl = new URL(originalUrl);
    dns.lookup(parsedUrl.hostname, async (err) => {
      if (err) return res.json({ error: "invalid url" });

      const count = await Url.countDocuments({});
      const shortCode = count + 1;

      const newUrl = new Url({
        original_url: originalUrl,
        short_url: shortCode,
      });
      await newUrl.save();

      res.json({ original_url: originalUrl, short_url: shortCode });
    });
  } catch {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:id", async (req, res) => {
  const id = req.params.id;
  const foundUrl = await Url.findOne({ short_url: id });

  if (foundUrl) {
    res.redirect(foundUrl.original_url);
  } else {
    res.json({ error: "No short URL found for given input" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
