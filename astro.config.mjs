import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

const GITHUB_USERNAME = "kose-morisawa";
const REPO_NAME = "ai-saas-affiliate";

export default defineConfig({
  site: `https://${GITHUB_USERNAME}.github.io`,
  base: `/${REPO_NAME}`,
  integrations: [
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});
