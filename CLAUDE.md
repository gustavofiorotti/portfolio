# Portfólio — Gustavo Fiorotti

Site estático em **Next.js (App Router) + TypeScript + Tailwind CSS v4 + next-intl + Motion**, exportado
com `output: "export"` e hospedado na Vercel em https://gufi.vercel.app. O `gus.poke.site` (assistente Poke)
é só um redirect para lá. Personagem 3D em React Three Fiber (entra nas próximas etapas).

Leia também `AGENTS.md`: esta versão do Next.js tem mudanças; consulte `node_modules/next/dist/docs/` antes
de usar uma API.

## Comandos

- `pnpm dev` — servidor local em http://localhost:3000
- `pnpm build` — gera `out/` (é o que a Vercel publica)
- `pnpm test` — testes unitários (Vitest + jsdom)
- `pnpm lint` e `pnpm typecheck`

## Estrutura

- `src/app/(pt)/` — layout raiz e página em português, servidos em `/`.
- `src/app/(en)/en/` — layout raiz e página em inglês, servidos em `/en`.
  São dois layouts raiz (route groups) para o PT ficar sem prefixo sem precisar de proxy, que a
  exportação estática não suporta.
- `src/messages/pt.json` e `en.json` — textos do site. As chaves precisam ser iguais nos dois
  (há teste para isso).
- `src/i18n/` — locales e configuração do next-intl (`setRequestLocale` em cada layout e página).
- `src/components/site/` — componentes do site; `RootShell` monta `<html>`, fontes e tema.
- `src/lib/theme.ts` — script inline que aplica o tema salvo (ou o do sistema) antes da primeira pintura.

## Deploy

- A Vercel está ligada ao repositório: push em `main` publica em produção e cada PR ganha uma URL de
  prévia. O `vercel.json` fixa o framework como Next.js. Não há workflow de deploy no GitHub Actions.
- Não hospedar nada no Poke: ele não tem deploy por Git, rollback, headers nem backend. O `gus.poke.site`
  só redireciona para a Vercel.
- Fluxo de branches: `feature/*` → PR para `develop` → PR de release `develop` → `main`.

## Convenções

- Texto do site em português (pt-BR) e inglês, sempre pelas mensagens do next-intl; código e comentários
  em inglês.
- Exportação estática: nada de Server Actions, cookies, proxy, redirects/rewrites do Next ou rotas
  dinâmicas sem `generateStaticParams`.
- Cores só pelos tokens de `src/app/globals.css` (nunca preto ou branco puros).
- Não expor clientes, ERPs, produtos internos, endpoints ou arquitetura (contrato de
  confidencialidade). O produto se escreve "Gnexum".
- Ao trocar de branch, apagar `.next` antes do `pnpm build` (e reiniciar o `pnpm dev`): o cache reaproveita o CSS da branch anterior e o resultado engana.
- Layout precisa funcionar em celular (sem scroll horizontal) e respeitar `prefers-reduced-motion`.
- Antes de mexer em UI, carregar a skill `kit-gustavo`. Mockups aprovados: canvas da direção A em
  https://claude.ai/artifact/3M4R5sjCV7gbGUNmcqsZoY. Protótipo do personagem e logo 3D em
  `~/projetos/portfolio-materiais/` (fora do repo).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
