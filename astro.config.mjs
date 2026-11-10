// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL and BASE_PATH are injected by the GitHub Pages workflow.
// Locally they fall back to root so `pnpm dev` works without extra setup.
export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  base: process.env.BASE_PATH ?? '/',
  vite: {
    plugins: [tailwindcss()],
  },
});
