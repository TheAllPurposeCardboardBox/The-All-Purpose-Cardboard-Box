// dailyWiki.js
import fs from "fs";
import fetch from "node-fetch";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const FILE_PATH = "./articles.json";

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

function updateArticlesFile(article) {
  let articles = [];
  if (fs.existsSync(FILE_PATH)) {
    articles = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  }
  if (!articles.find(a => a.date === article.date)) {
    articles.unshift(article); // add to top
    fs.writeFileSync(FILE_PATH, JSON.stringify(articles, null, 2));
  }
}

async function main() {
  const article = await getRandomWikiArticle();
  updateArticlesFile(article);
  await sendToDiscord(article);
}

main();
