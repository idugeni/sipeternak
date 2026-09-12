import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";

const FALLBACK_SITE_URL = "https://sipeternak.vercel.app";

/**
 * Emit robots.txt + sitemap.xml from NEXT_PUBLIC_SITE_URL so the domain
 * stays configurable via .env (static files in public/ can't use env).
 */
function siteMetaPlugin(): Plugin {
  let siteUrl = FALLBACK_SITE_URL;
  return {
    name: "site-meta",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, [
        "VITE_",
        "NEXT_PUBLIC_",
      ]);
      siteUrl = (env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(
        /\/+$/,
        ""
      );
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          `  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n` +
          `</urlset>\n`,
      });
    },
  };
}

const plugins = [react(), tailwindcss(), siteMetaPlugin()];

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
