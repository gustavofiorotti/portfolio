# Portfólio — Gustavo Fiorotti

Site pessoal em Next.js (exportação estática), em português e inglês: https://gufi.vercel.app

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # testes unitários
pnpm build      # gera out/
```

Detalhes de estrutura, convenções e deploy em `CLAUDE.md`.

## Currículo em PDF

`public/curriculo-gustavo-fiorotti.pdf` é gerado por `scripts/build_cv.py` (Python 3.10+ e
[reportlab](https://pypi.org/project/reportlab/)). Com o [uv](https://docs.astral.sh/uv/), as
dependências vêm do próprio script:

```sh
uv run scripts/build_cv.py              # grava public/curriculo-gustavo-fiorotti.pdf
```

Para conferir (1 página, sem telefone, extraindo o texto com pypdf): `uv run scripts/check_cv.py`.

Sem uv: `pip install reportlab pypdf`, depois `python3 scripts/build_cv.py` e `python3 scripts/check_cv.py`. O PDF publicado não traz telefone
e precisa caber em 1 página. O texto segue o contexto de carreira mantido fora do repositório.

## Atividade do GitHub

`src/data/github-contributions.json` (total, data da coleta e 53 semanas × 7 dias com nível 0–4) é
atualizado por `scripts/fetch-github-contributions.mjs`, que roda sozinho antes do `pnpm build`
(`prebuild`) e consulta a API GraphQL do GitHub com a variável `GITHUB_TOKEN`. Sem token ou com erro
de rede, o script mantém o JSON versionado e o build segue normalmente.

- Local: `GITHUB_TOKEN=$(gh auth token) pnpm fetch:github` atualiza o snapshot (versione o resultado).
- Vercel: para o site atualizar a cada deploy, cadastre `GITHUB_TOKEN` nas variáveis de ambiente do
  projeto (token sem escopos extras basta para ler contribuições públicas; ainda não configurado).
