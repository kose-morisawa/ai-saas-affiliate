/**
 * AI不使用のデータ収集スクリプト。GitHub Actions から呼び出される。
 * GitHub Trending / HackerNews / Product Hunt のデータを取得して data/raw/ に保存。
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const today = new Date().toISOString().split("T")[0];
const outputPath = join(process.cwd(), "data", "raw", `${today}.json`);

if (existsSync(outputPath)) {
  console.log(`[skip] ${outputPath} already exists`);
  process.exit(0);
}

mkdirSync(join(process.cwd(), "data", "raw"), { recursive: true });

// GitHub: 直近7日でstar急増のAI/SaaS関連リポジトリ
async function fetchGitHub() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = `https://api.github.com/search/repositories?q=topic:ai+OR+topic:llm+OR+topic:saas+created:>${sevenDaysAgo}&sort=stars&order=desc&per_page=20`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-saas-affiliate-bot/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`[github] HTTP ${res.status}`);
    return [];
  }

  const data = (await res.json()) as {
    items: Array<{
      full_name: string;
      description: string | null;
      stargazers_count: number;
      html_url: string;
      topics: string[];
      language: string | null;
    }>;
  };

  return data.items.map((r) => ({
    name: r.full_name,
    description: r.description ?? "",
    stars: r.stargazers_count,
    url: r.html_url,
    topics: r.topics,
    language: r.language ?? "",
  }));
}

// HackerNews: 直近24時間のトップストーリー
async function fetchHackerNews() {
  const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const url = `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>${since}&hitsPerPage=20`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ai-saas-affiliate-bot/1.0" },
  });
  if (!res.ok) {
    console.warn(`[hn] HTTP ${res.status}`);
    return [];
  }

  const data = (await res.json()) as {
    hits: Array<{
      title: string;
      url: string | null;
      points: number;
      num_comments: number;
    }>;
  };

  return data.hits
    .filter((h) => h.url)
    .map((h) => ({
      title: h.title,
      url: h.url!,
      points: h.points,
      num_comments: h.num_comments,
    }));
}

// Product Hunt: トップページからトレンドをスクレイプ（APIキー不要）
async function fetchProductHunt() {
  try {
    const res = await fetch("https://www.producthunt.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ai-saas-affiliate-bot/1.0; +https://github.com/)",
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    // og:title タグからトップ製品名を抽出
    const matches = html.matchAll(
      /<a[^>]+href="\/posts\/([^"]+)"[^>]*>([^<]{3,80})<\/a>/g
    );
    const products: Array<{ name: string; url: string }> = [];
    for (const m of matches) {
      if (products.length >= 10) break;
      const name = m[2].trim();
      if (name.length > 2 && !name.includes("\n")) {
        products.push({
          name,
          url: `https://www.producthunt.com/posts/${m[1]}`,
        });
      }
    }
    return products;
  } catch {
    console.warn("[ph] fetch failed");
    return [];
  }
}

async function main() {
  console.log(`[fetch] ${today}`);

  const [github_trending, hackernews, product_hunt] = await Promise.all([
    fetchGitHub().catch(() => []),
    fetchHackerNews().catch(() => []),
    fetchProductHunt().catch(() => []),
  ]);

  const output = {
    date: today,
    fetched_at: new Date().toISOString(),
    github_trending,
    hackernews,
    product_hunt,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `[done] ${outputPath} — github:${github_trending.length} hn:${hackernews.length} ph:${product_hunt.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
