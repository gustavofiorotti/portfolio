// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Production runs on Vercel at https://gufi.vercel.app (gus.poke.site only redirects there).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://gufi.vercel.app',
  vite: {
    plugins: [tailwindcss()],
  },
});
