// dailyWiki.js
import fs from "fs";
import fetch from "node-fetch";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const FILE_PATH = "./articles.json";

// Get a random Wikipedia article
async function getRandomWikiArticle() {
  const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
  const data = await response.json();
  return {
    date: new Date().toISOString().split("T")[0],
    title: data.title,
    extract: data.extract,
    url: data.content_urls.desktop.page,
    image: data.thumbnail?.source || null,
  };
}

// Send an embedded message to Discord
async function sendToDiscord(article) {
  const embed = {
    embeds: [
      {
        title: article.title,
        description: article.extract.slice(0, 2000),
        url: article.url,
        color: 3447003,
        thumbnail: article.image ? { url: article.image } : undefined,
        footer: { text: `📅 ${article.date} • Random Wikipedia Article` },
      },
    ],
  };

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embed),
  });
}

// Safely update or create the JSON file
function updateArticlesFile(article) {
  let articles = [];

  try {
    if (fs.existsSync(FILE_PATH)) {
      const text = fs.readFileSync(FILE_PATH, "utf8").trim();
      if (text) {
        articles = JSON.parse(text);
      }
    }
  } catch (err) {
    console.error("⚠️ Failed to read articles.json, starting fresh:", err);
    articles = [];
  }

  // Add today’s article if not already there
  if (!articles.find(a => a.date === article.date)) {
    articles.unshift(article);
  }

  // Keep only the last 30 days
  if (articles.length > 30) {
    articles = articles.slice(0, 30);
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(articles, null, 2));
}

// Main async runner
async function main() {
  try {
    const article = await getRandomWikiArticle();
    updateArticlesFile(article);
    await sendToDiscord(article);
    console.log("✅ Article posted and saved successfully!");
  } catch (err) {
    console.error("❌ Failed to post article:", err);
    process.exit(1);
  }
}

// Run the script
main();
