const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  }),
);

app.use(express.json());

const browserOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
};

// Blocking images and other resources to speed up loading
async function setupPageInterception(page) {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    if (["image", "media", "font"].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

// Auto-scroll with a limited number of scrolls
async function autoScroll(page, scrollLimit = 5) {
  await page.evaluate(async (scrollLimit) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let scrollCount = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount += 1;

        if (
          scrollCount >= scrollLimit ||
          totalHeight >= document.body.scrollHeight
        ) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }, scrollLimit);
}

app.post("/search", async (req, res) => {
  const { searchQuery } = req.body;

  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();

  await setupPageInterception(page);

  // Navigating to Instagram's explore page
  await page.goto("https://www.instagram.com/explore/", {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector("article");

  await autoScroll(page, 5);

  // Filtering posts based on the search query
  const posts = await page.evaluate((searchQuery) => {
    let postElements = document.querySelectorAll("article div div div div a");
    let matchingPosts = [];

    postElements.forEach((post) => {
      let desc = post.innerText || "";
      let link = post.href;
      if (desc.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchingPosts.push({ desc, link });
      }
    });

    return matchingPosts;
  }, searchQuery.toLowerCase());

  await browser.close();

  res.json(posts); // Returning matching posts as JSON response
});

app.post("/search-tag", async (req, res) => {
  const { searchQuery } = req.body;
  console.log(searchQuery);

  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();

  await setupPageInterception(page);

  async function loginToInstagram(page, username, password) {
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    await page.click('button[type="submit"]');


    await page.waitForNavigation({ waitUntil: "networkidle2" });
  }
  
   await loginToInstagram(page, "Rev", "123456");
  // Navigating to the hashtag's page
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
  );
  await page.goto(`https://www.instagram.com/explore/tags/${searchQuery}/`, {
    waitUntil: "domcontentloaded",
  });
  try {
    await page.waitForSelector("article", { visible: true });
  } catch (error) {
    const pageContent = await page.content(); // Get the page content

    console.log("Page content at error:", pageContent);
    console.error("Error waiting for selector:", error);
    await browser.close();
    return res.status(500).json({ error: "Failed to load content" });
  }

  await autoScroll(page, 5);

  // Extracting posts related to the hashtag
  const posts = await page.evaluate(() => {
    let postElements = document.querySelectorAll("article div div div div a");
    let hashtagPosts = [];

    postElements.forEach((post) => {
      let desc = post.innerText || "";
      let link = post.href;
      hashtagPosts.push({ desc, link });
    });

    return hashtagPosts;
  });

  await browser.close();

  res.json(posts); // Returning posts as JSON response
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
