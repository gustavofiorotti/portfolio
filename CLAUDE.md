# Portfólio — Gustavo Fiorotti

Site estático em Astro + Tailwind CSS v4, publicado no GitHub Pages. O endereço público
`gus.poke.site` é um redirect configurado pelo assistente Poke para a URL do Pages.

Veja também `AGENTS.md` (instruções do Astro).

## Comandos

- `pnpm dev` — servidor local em http://localhost:4321
- `pnpm build` — gera `dist/` (é o que o CI publica)
- `pnpm preview` — serve o build localmente

## Deploy

- Push em `main` dispara `.github/workflows/deploy.yml`, que publica no GitHub Pages.
- O workflow injeta `SITE_URL` e `BASE_PATH`; por isso **nunca** escrever caminhos absolutos
  fixos (`/img.png`). Usar `import.meta.env.BASE_URL` ou importar assets de `src/`.
- Fluxo de branches: `feature/*` → PR para `develop` → PR de release `develop` → `main`.

## Convenções

- Texto do site em português (pt-BR); código e comentários em inglês.
- Componentes em `src/components/`, layout base em `src/layouts/Layout.astro`.
- Não expor clientes, ERPs, produtos internos, endpoints ou arquitetura (contrato de
  confidencialidade). O produto se escreve "Gnexum".
- Layout precisa funcionar em celular (sem scroll horizontal) e respeitar `prefers-reduced-motion`.
