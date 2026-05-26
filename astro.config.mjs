import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// GitHubユーザー名を USERNAME に入れる（例: koumo → https://koumo.github.io）
// リポジトリ名が "ai-saas-affiliate" 以外の場合は base も変える
const GITHUB_USERNAME = "kose-morisawa";
const REPO_NAME = "ai-saas-affiliate";

export default defineConfig({
  site: `https://${GITHUB_USERNAME}.github.io`,
  base: `/${REPO_NAME}`,
  integrations: [
    mdx(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});
