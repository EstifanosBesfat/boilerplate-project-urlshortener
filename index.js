require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlParser = require('url')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urlDatabase = {};
let counter = 1;

app.post('/api/shorturl',(req, res) => {
  const originalUrl = req.body.url;

  // validate url format
  try {
    const parsedUrl = new URL(originalUrl);
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({error: 'invalid url'});
      }
      const shortCode = counter++;
      urlDatabase[shortCode] = originalUrl;

      res.json({
        original_url: originalUrl,
        short_url: shortCode
      })
    })
  } catch (error) {
    res.json({error: 'invlaid url'})
  }
})

app.get('/api/shorturl/:id',(req, res) => {
  const id = req.params.id;
  const originalUrl = urlDatabase[id];

  if(originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json ({error: 'no short url found for given input'});
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
