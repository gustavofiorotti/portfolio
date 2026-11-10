# Portfólio — Gustavo Fiorotti

Site estático em Astro + Tailwind CSS v4, hospedado em `gus.poke.site` pelo assistente Poke,
que publica o conteúdo da branch `publicacao` deste repositório.

Veja também `AGENTS.md` (instruções do Astro).

## Comandos

- `pnpm dev` — servidor local em http://localhost:4321
- `pnpm build` — gera `dist/` (é o que o CI publica)
- `pnpm preview` — serve o build localmente

## Deploy

- Push em `main` dispara `.github/workflows/publish.yml`: gera o build, força o push de `dist/`
  na branch `publicacao` (HTML pronto, sem build) e chama a Poke API pedindo a republicação.
- O secret `POKE_API_KEY` (chave V2 criada em https://poke.com/kitchen) fica no GitHub. Sem ele,
  o workflow só avisa e o Poke precisa ser avisado manualmente (`scripts/notify-poke.sh`).
- A Poke API é só de ida: a resposta do Poke chega no app/mensagens do Gustavo, não aqui.
- Depois de cada merge em `main`, lembrar o Gustavo de conferir no Poke se o site foi republicado.
- Nunca escrever caminhos absolutos fixos (`/img.png`); usar `import.meta.env.BASE_URL` ou
  importar assets de `src/`.
- Fluxo de branches: `feature/*` → PR para `develop` → PR de release `develop` → `main`.
- Nunca editar a branch `publicacao` à mão: ela é sobrescrita a cada publicação.

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
