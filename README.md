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

Sem uv: `pip install reportlab` e `python3 scripts/build_cv.py`. O PDF publicado não traz telefone
e precisa caber em 1 página. O texto segue o contexto de carreira mantido fora do repositório.
