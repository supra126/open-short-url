#!/usr/bin/env bash
# ============================================================
# check-env-sync.sh
# Verify that .env.docker.example covers all env vars
# referenced in docker-compose.yml from backend & frontend.
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

DOCKER_ENV="$ROOT_DIR/.env.docker.example"
BACKEND_ENV="$ROOT_DIR/apps/backend/.env.example"
FRONTEND_ENV="$ROOT_DIR/apps/frontend/.env.example"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Extract uncommented KEY=value lines from an env file
extract_env_keys() {
  grep -E '^[A-Z_][A-Z0-9_]*=' "$1" | cut -d'=' -f1 | sort -u
}

# Extract ${VAR_NAME:-...} references from docker-compose.yml
extract_compose_vars() {
  grep -oE '\$\{[A-Z_][A-Z0-9_]*' "$1" | sed 's/\${//' | sort -u
}

# Vars that are constructed/hardcoded in docker-compose.yml, not expected in .env.docker
EXCLUDED_VARS=(
  DATABASE_URL      # Composed from POSTGRES_* vars in docker-compose
  REDIS_HOST        # Hardcoded as service name 'redis'
  REDIS_DB          # Not used in Docker deployment
  PORT              # Hardcoded in docker-compose
  HOST              # Hardcoded in docker-compose
  HOSTNAME          # Hardcoded in docker-compose
  NODE_ENV          # Has default in docker-compose
  IMAGE_TAG         # Docker-specific, not an app var
)

is_excluded() {
  local var="$1"
  for excluded in "${EXCLUDED_VARS[@]}"; do
    [[ "$var" == "$excluded" ]] && return 0
  done
  return 1
}

echo "========================================"
echo " Environment Variable Sync Check"
echo "========================================"
echo ""

has_error=0

# --- Check 1: Compose vars vs .env.docker.example ---
echo -e "${YELLOW}[Check 1]${NC} docker-compose.yml vars → .env.docker.example"
echo "---"

docker_keys=$(extract_env_keys "$DOCKER_ENV")
compose_vars=$(extract_compose_vars "$COMPOSE_FILE")

missing_in_docker=()
for var in $compose_vars; do
  if is_excluded "$var"; then
    continue
  fi
  if ! echo "$docker_keys" | grep -qx "$var"; then
    missing_in_docker+=("$var")
  fi
done

if [[ ${#missing_in_docker[@]} -eq 0 ]]; then
  echo -e "${GREEN}✓${NC} All docker-compose.yml variables are covered in .env.docker.example"
else
  has_error=1
  echo -e "${RED}✗${NC} Missing in .env.docker.example (referenced by docker-compose.yml):"
  for var in "${missing_in_docker[@]}"; do
    echo -e "  ${RED}-${NC} $var"
  done
fi
echo ""

# --- Check 2: Backend required vars vs docker-compose backend environment ---
echo -e "${YELLOW}[Check 2]${NC} backend/.env.example [REQUIRED] vars → docker-compose backend service"
echo "---"

# Extract vars marked as REQUIRED (look for [REQUIRED] comment above or on same line)
backend_required=$(awk '
  /\[REQUIRED\]/ { found=1; next }
  found && /^[A-Z_][A-Z0-9_]*=/ { print $0; found=0; next }
  /^[A-Z_][A-Z0-9_]*=/ && /REQUIRED/ { print $0; next }
  /^[A-Z_][A-Z0-9_]*=/ { found=0 }
  /^#/ && !/\[REQUIRED\]/ { found=0 }
' "$BACKEND_ENV" | cut -d'=' -f1 | sort -u)

# Extract backend environment vars from docker-compose
# Use sed to extract the backend service's environment block, then grep for var names
compose_backend_vars=$(sed -n '/^  backend:/,/^  [a-z]/p' "$COMPOSE_FILE" \
  | sed -n '/environment:/,/^    [a-z]/p' \
  | grep -oE '^\s+[A-Z_][A-Z0-9_]*:' \
  | sed 's/[: ]//g' | sort -u)

missing_backend=()
for var in $backend_required; do
  if is_excluded "$var"; then
    continue
  fi
  if ! echo "$compose_backend_vars" | grep -qx "$var"; then
    missing_backend+=("$var")
  fi
done

if [[ ${#missing_backend[@]} -eq 0 ]]; then
  echo -e "${GREEN}✓${NC} All required backend vars are passed through docker-compose"
else
  has_error=1
  echo -e "${RED}✗${NC} Required backend vars NOT passed in docker-compose backend service:"
  for var in "${missing_backend[@]}"; do
    echo -e "  ${RED}-${NC} $var"
  done
fi
echo ""

# --- Check 3: Frontend NEXT_PUBLIC_ vars vs docker-compose frontend environment ---
echo -e "${YELLOW}[Check 3]${NC} frontend/.env.example NEXT_PUBLIC_* → docker-compose frontend service"
echo "---"

frontend_public=$(extract_env_keys "$FRONTEND_ENV" | grep '^NEXT_PUBLIC_')

compose_frontend_vars=$(sed -n '/^  frontend:/,/^  [a-z]\|^volumes:/p' "$COMPOSE_FILE" \
  | sed -n '/environment:/,/^    [a-z]\|^  [a-z]\|^volumes:/p' \
  | grep -oE '^\s+NEXT_PUBLIC_[A-Z0-9_]*:' \
  | sed 's/[: ]//g' | sort -u)

missing_frontend=()
for var in $frontend_public; do
  if ! echo "$compose_frontend_vars" | grep -qx "$var"; then
    missing_frontend+=("$var")
  fi
done

if [[ ${#missing_frontend[@]} -eq 0 ]]; then
  echo -e "${GREEN}✓${NC} All frontend NEXT_PUBLIC_* vars are passed through docker-compose"
else
  has_error=1
  echo -e "${RED}✗${NC} Frontend NEXT_PUBLIC_* vars NOT passed in docker-compose frontend service:"
  for var in "${missing_frontend[@]}"; do
    echo -e "  ${RED}-${NC} $var"
  done
fi
echo ""

# --- Summary ---
echo "========================================"
if [[ $has_error -eq 0 ]]; then
  echo -e "${GREEN}All checks passed!${NC} Environment files are in sync."
else
  echo -e "${RED}Some checks failed.${NC} Please update the files above."
fi
echo "========================================"

exit $has_error
