import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Static export: `next build` writes plain HTML/CSS/JS to out/, which Vercel serves.
// PT lives at "/" and EN at "/en" through two root layouts, so no proxy/rewrite is needed.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
