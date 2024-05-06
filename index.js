const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();


app.use(express.static('public'));

app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;
  
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const productElements = document.querySelectorAll('.s-search-results .s-result-item');

    const products = [];
    productElements.forEach((element) => {
      const titleElement = element.querySelector('h2 .a-link-normal');
      const ratingElement = element.querySelector('.a-icon-star-small .a-icon-alt');
      const reviewElement = element.querySelector('.a-size-base.s-underline-text');
      const imageElement = element.querySelector('.s-image');

      if (titleElement && imageElement) {
        const title = titleElement.textContent.trim();
        const imageUrl = imageElement.src;
        const rating = ratingElement ? parseFloat(ratingElement.textContent.trim()) : null;
        const reviews = reviewElement ? parseInt(reviewElement.textContent.trim().replace(',', '')) : null;

        products.push({
          title,
          rating,
          reviews,
          imageUrl,
        });
      }
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to scrape Amazon' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
