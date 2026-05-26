/**
 * Google Search Console API からパフォーマンスデータを取得。
 * AI不使用。GitHub Actions の weekly-analysis.yml から呼び出される。
 *
 * 準備: GCP Service Account JSON を GSC_SERVICE_ACCOUNT_JSON 環境変数に設定
 * サイトURL: SITE_URL 環境変数（例: https://example.com）
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SITE_URL = process.env.SITE_URL ?? "";
const SERVICE_ACCOUNT_JSON = process.env.GSC_SERVICE_ACCOUNT_JSON ?? "";

if (!SITE_URL || !SERVICE_ACCOUNT_JSON) {
  console.error(
    "[gsc] SITE_URL または GSC_SERVICE_ACCOUNT_JSON が未設定です。スキップします。"
  );
  process.exit(0);
}

const today = new Date().toISOString().split("T")[0];
const endDate = today;
const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

mkdirSync(join(process.cwd(), "data", "gsc"), { recursive: true });
const outputPath = join(process.cwd(), "data", "gsc", `${today}.json`);

// Service Account でアクセストークンを取得（OAuth2 JWT フロー）
async function getAccessToken(): Promise<string> {
  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  // Node.js built-in crypto で RS256 署名
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");

  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`GSC auth failed: ${data.error}`);
  return data.access_token;
}

async function fetchGSC(token: string) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page", "query"],
      rowLimit: 500,
      dataState: "final",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function main() {
  console.log(`[gsc] ${startDate} → ${endDate}`);
  const token = await getAccessToken();
  const data = await fetchGSC(token);

  const output = {
    date: today,
    period: { start: startDate, end: endDate },
    site: SITE_URL,
    rows: data.rows ?? [],
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`[done] ${outputPath} — ${output.rows.length} rows`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
