# Portfólio — Gustavo Fiorotti

Site estático em Astro + Tailwind CSS v4, hospedado na Vercel em https://gufi.vercel.app.
O `gus.poke.site` (assistente Poke) é só um redirect para lá.

Veja também `AGENTS.md` (instruções do Astro).

## Comandos

- `pnpm dev` — servidor local em http://localhost:4321
- `pnpm build` — gera `dist/` (é o que a Vercel publica)
- `pnpm preview` — serve o build localmente

## Deploy

- A Vercel está ligada ao repositório: push em `main` publica em produção (https://gufi.vercel.app)
  e cada PR ganha uma URL de prévia. Não há workflow de deploy no GitHub Actions.
- Não hospedar nada no Poke: ele não tem deploy por Git, rollback, headers nem backend
  (confirmado pelo próprio Poke em 12/11/2026). O `gus.poke.site` só redireciona para a Vercel.
- Fluxo de branches: `feature/*` → PR para `develop` → PR de release `develop` → `main`.

## Convenções

- Texto do site em português (pt-BR); código e comentários em inglês.
- Componentes em `src/components/`, layout base em `src/layouts/Layout.astro`.
- Não expor clientes, ERPs, produtos internos, endpoints ou arquitetura (contrato de
  confidencialidade). O produto se escreve "Gnexum".
- Layout precisa funcionar em celular (sem scroll horizontal) e respeitar `prefers-reduced-motion`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
