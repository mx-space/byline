#!/bin/bash

set -euo pipefail

ulimit -S -c "${BYLINE_CORE_DUMP_LIMIT:-0}"

mask_secret() {
  if [ -z "${1:-}" ]; then echo "<empty>"; else echo "<set,len=${#1}>"; fi
}

mask_url_password() {
  echo "${1:-}" | sed -E 's#(://[^:/@]+):[^@]+@#\1:****@#'
}

parse_bool() {
  case "${1:-}" in
  true | TRUE | 1 | yes | YES | on | ON) echo "true" ;;
  false | FALSE | 0 | no | NO | off | OFF) echo "false" ;;
  *) echo "" ;;
  esac
}

if [ -z "${REDIS_CONNECTION_STRING:-}" ] && [ -n "${REDIS_URL:-}" ]; then
  export REDIS_CONNECTION_STRING="$REDIS_URL"
fi

# Docker Swarm sets HOSTNAME to "<service>.<slot>.<task-id>"; give each replica
# its own snowflake worker offset so ids never collide.
if [ -z "${SNOWFLAKE_WORKER_OFFSET:-}" ] && [ -z "${NODE_APP_INSTANCE:-}" ]; then
  swarm_slot=$(echo "${HOSTNAME:-}" | awk -F. '{ if (NF >= 3 && $2 ~ /^[0-9]+$/) print $2 }')
  if [ -n "$swarm_slot" ]; then
    export SNOWFLAKE_WORKER_OFFSET="$swarm_slot"
  fi
fi

if [ -n "${PG_URL:-${PG_CONNECTION_STRING:-}}" ]; then
  pg_target="$(mask_url_password "${PG_URL:-${PG_CONNECTION_STRING:-}}")"
else
  pg_target="${PG_USER:-mx}@${PG_HOST:-127.0.0.1}:${PG_PORT:-5432}/${PG_DATABASE:-byline}"
fi

if [ -n "${REDIS_CONNECTION_STRING:-}" ]; then
  redis_target="$(mask_url_password "$REDIS_CONNECTION_STRING")"
else
  redis_target="${REDIS_HOST:-127.0.0.1}:${REDIS_PORT:-6379}"
fi

echo "============== Byline =============="
echo "- Node: $(node -v)"
echo "- Port: ${PORT:-2333}"
echo "- PostgreSQL: ${pg_target}"
echo "- Redis: ${redis_target}"
echo "- Allowed origins: ${ALLOWED_ORIGINS:-<same-origin only>}"
echo "- Snowflake worker id: ${SNOWFLAKE_WORKER_ID:-<unset>} (offset ${SNOWFLAKE_WORKER_OFFSET:-0})"
echo "- JWT secret: $(mask_secret "${JWT_SECRET:-}")"
echo "- Encryption: $(parse_bool "${ENCRYPT_ENABLE:-${MX_ENCRYPT_ENABLE:-}}") key=$(mask_secret "${ENCRYPT_KEY:-${MX_ENCRYPT_KEY:-}}")"
echo "===================================="

if [ "${1:-}" != "" ] && [[ "${1:-}" != -* ]]; then
  exec "$@"
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "JWT_SECRET is required (32+ random characters, e.g. \`openssl rand -hex 32\`)." >&2
  exit 1
fi

# Single-container deployments migrate on boot. Migrations hold a Postgres
# advisory lock, so concurrent replicas serialize. Compose sets this to false
# because its one-shot `migrate` service owns the step.
if [ "$(parse_bool "${BYLINE_AUTO_MIGRATE:-true}")" = "true" ]; then
  node migrate.mjs
fi

exec node main.mjs "$@"
