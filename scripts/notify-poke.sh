#!/usr/bin/env bash
# Asks the Poke assistant to republish gus.poke.site from the `publicacao` branch.
# Requires POKE_API_KEY (V2 key created at https://poke.com/kitchen) in the environment.
# Works in CI (GitHub Actions) and locally: POKE_API_KEY=... ./scripts/notify-poke.sh
set -euo pipefail

: "${POKE_API_KEY:?Defina POKE_API_KEY no ambiente}"

repo="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
sha="${GITHUB_SHA:-$(git rev-parse HEAD)}"
summary="${COMMIT_MESSAGE:-$(git log -1 --pretty=%s)}"
summary="$(printf '%s' "$summary" | head -n 1)"

message="Atualizei meu portfólio no GitHub. Por favor, republique o site gus.poke.site \
usando exatamente o conteúdo da branch 'publicacao' do repositório https://github.com/${repo} \
(arquivos estáticos prontos: index.html na raiz, sem build). \
Commit de origem: ${sha:0:7} — ${summary}. Não altere o conteúdo nem o design; só publique."

payload="$(jq -n --arg m "$message" '{message: $m}')"

curl -fsS -X POST "https://poke.com/api/v1/inbound/api-message" \
  -H "Authorization: Bearer ${POKE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$payload"
echo
