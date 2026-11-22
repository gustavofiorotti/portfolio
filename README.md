# Portfólio — Gustavo Fiorotti

Site pessoal de Gustavo Fiorotti, desenvolvedor de software: apresentação, experiência, projetos,
atividade no GitHub e currículo em PDF, em português e inglês.

**No ar:** https://gufi.vercel.app (português em `/`, inglês em `/en`)

## Stack

- [Next.js](https://nextjs.org) (App Router) com exportação estática (`output: "export"`)
- TypeScript e React
- [Tailwind CSS](https://tailwindcss.com) v4
- [next-intl](https://next-intl.dev) para os dois idiomas
- [Motion](https://motion.dev) para as animações
- [React Three Fiber](https://r3f.docs.pmnd.rs) e three.js para o mascote 3D
- [Vitest](https://vitest.dev) e Testing Library nos testes
- Hospedagem na [Vercel](https://vercel.com)

## Como rodar

Requisitos: Node.js 24 (`.nvmrc`; o mínimo aceito é o do campo `engines`) e pnpm, com a versão
fixada em `packageManager` no `package.json` (`corepack enable` instala a versão certa).

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

## Testes e qualidade

```sh
pnpm test         # testes unitários (Vitest + jsdom)
pnpm lint         # ESLint
pnpm typecheck    # TypeScript sem emitir arquivos
```

## Build

```sh
pnpm build        # gera o site estático em out/
```

Antes do build, o `prebuild` atualiza a grade de atividade do GitHub (veja abaixo). Para ver o
resultado localmente, qualquer servidor estático serve, por exemplo `npx serve out`.

Ao trocar de branch, apague a pasta `.next` antes do build: o cache pode reaproveitar o CSS da branch
anterior.

## Estrutura

```
src/
  app/(pt)/          página e layout em português, servidos em /
  app/(en)/en/       página e layout em inglês, servidos em /en
  app/globals.css    tokens de cor, tipografia e estilos globais
  components/        componentes do site (header, seções, mascote, UI)
  messages/          textos do site: pt.json e en.json, com as mesmas chaves
  i18n/              idiomas e configuração do next-intl
  data/              dados versionados, como a atividade do GitHub
  lib/               utilitários (tema, navegador, projetos etc.)
public/              imagens, ícones e o currículo em PDF
scripts/             geração do currículo e coleta da atividade do GitHub
```

Todo texto visível passa pelos arquivos de `src/messages/`, e um teste garante que os dois idiomas
têm as mesmas chaves. As cores vêm só dos tokens de `globals.css`, com tema claro e escuro.

## Deploy

- A Vercel está ligada ao repositório: cada pull request ganha uma URL de prévia, e o push em `main`
  publica em produção.
- Fluxo de branches: `feature/*`, `fix/*` ou `docs/*` → pull request para `develop` → pull request de
  release de `develop` para `main`.
- O workflow `.github/workflows/atualiza-github.yml` chama um Deploy Hook da Vercel a cada 12 horas,
  para a grade do GitHub se atualizar sem commit. Ele usa o segredo `VERCEL_DEPLOY_HOOK_URL`; sem o
  segredo, o job só deixa um aviso e termina sem erro.

## Atividade do GitHub

`src/data/github-contributions.json` (total, data da coleta e 53 semanas × 7 dias com nível de 0 a 4)
é atualizado por `scripts/fetch-github-contributions.mjs`, que roda antes de todo `pnpm build` e
consulta a API GraphQL do GitHub com a variável `GITHUB_TOKEN`. Sem token ou sem rede, o script mantém
o JSON versionado e o build segue normalmente.

- Local: `GITHUB_TOKEN=$(gh auth token) pnpm fetch:github` atualiza o arquivo (versione o resultado).
- Vercel: o `GITHUB_TOKEN` fica nas variáveis de ambiente do projeto. Um token sem escopos extras
  basta para as contribuições públicas.

## Currículo em PDF

Há duas versões: `public/curriculo-gustavo-fiorotti.pdf` (português, servido em `/`) e
`public/curriculo-gustavo-fiorotti-en.pdf` (inglês, servido em `/en`). Ambas são geradas por
`scripts/build_cv.py` (Python 3.10+ e [reportlab](https://pypi.org/project/reportlab/)), com os
textos em `scripts/cv/pt.json` e `scripts/cv/en.json`. Só a versão em português é copiada para o
iCloud Drive. Com o [uv](https://docs.astral.sh/uv/), as dependências vêm do próprio script:

```sh
uv run scripts/build_cv.py              # grava o PDF em português
uv run scripts/build_cv.py --lang en    # grava o PDF em inglês
uv run scripts/check_cv.py              # confere os dois: 1 página, idioma certo e nenhum telefone
pnpm resume:pages                       # refaz as imagens da prévia no site, por idioma (macOS)
```

Sem o uv: `pip install reportlab pypdf`, depois `python3 scripts/build_cv.py` e
`python3 scripts/check_cv.py`.
