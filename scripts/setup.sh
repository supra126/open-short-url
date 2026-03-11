#!/bin/sh
# ============================================================
# Open Short URL - Quick Setup Script
# ============================================================
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/setup.sh)
#
# Or:
#   curl -fsSL -o setup.sh https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/setup.sh
#   chmod +x setup.sh && ./setup.sh
# ============================================================

set -e

REPO_URL="https://raw.githubusercontent.com/supra126/open-short-url/main"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
  echo ""
  echo "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo "${CYAN}║${NC}  ${BOLD}Open Short URL - Quick Setup${NC}            ${CYAN}║${NC}"
  echo "${CYAN}║${NC}  Self-hosted URL shortener              ${CYAN}║${NC}"
  echo "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo "${GREEN}[${1}/${TOTAL_STEPS}]${NC} ${BOLD}${2}${NC}"
}

print_warn() {
  echo "${YELLOW}!${NC} ${1}"
}

print_error() {
  echo "${RED}ERROR:${NC} ${1}"
}

# --- Pre-flight checks ---
check_requirements() {
  if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed. Please install Docker first:"
    echo "  https://docs.docker.com/get-docker/"
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose V2 is not available."
    echo "  Please update Docker or install docker-compose-plugin."
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
  fi
}

# --- Generate random string ---
generate_secret() {
  # Try openssl first, fallback to /dev/urandom
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 "$1" 2>/dev/null | tr -d '\n'
  else
    head -c 64 /dev/urandom | base64 | tr -d '\n/+=' | head -c "$1"
  fi
}

# --- Prompt with default ---
prompt() {
  local var_name="$1"
  local prompt_text="$2"
  local default_value="$3"

  if [ -n "$default_value" ]; then
    printf "  ${prompt_text} ${CYAN}[${default_value}]${NC}: "
  else
    printf "  ${prompt_text}: "
  fi

  read -r input
  input="${input:-$default_value}"
  eval "$var_name=\"\$input\""
}

# --- Main ---
main() {
  print_banner
  check_requirements

  TOTAL_STEPS=4

  # ========================================
  # Step 1: Collect user input
  # ========================================
  print_step 1 "Configure your instance"
  echo ""

  # Domain
  echo "  ${BOLD}Domain Configuration${NC}"
  echo "  Enter your domain. Leave empty for localhost (testing only)."
  echo ""
  prompt DOMAIN "  Domain (e.g. example.com)" ""
  echo ""

  if [ -n "$DOMAIN" ]; then
    PROTOCOL="https"
    BASE_URL="${PROTOCOL}://${DOMAIN}"

    echo "  ${BOLD}How will you access the services?${NC}"
    echo "  ${CYAN}1)${NC} Subdomains via reverse proxy  (app.${DOMAIN} / ${DOMAIN})"
    echo "  ${CYAN}2)${NC} Same domain, different ports  (${DOMAIN}:4100 / ${DOMAIN}:4101)"
    echo "  ${CYAN}3)${NC} Single domain, path routing   (${DOMAIN} for both)"
    echo ""
    prompt ACCESS_MODE "  Choose [1/2/3]" "1"

    case "$ACCESS_MODE" in
      2)
        FRONTEND_URL="https://${DOMAIN}:4100"
        BACKEND_URL="https://${DOMAIN}:4101"
        SHORT_URL_DOMAIN="https://${DOMAIN}:4101"
        NEXT_PUBLIC_API_URL="https://${DOMAIN}:4101"
        ;;
      3)
        FRONTEND_URL="https://${DOMAIN}"
        BACKEND_URL="https://${DOMAIN}"
        SHORT_URL_DOMAIN="https://${DOMAIN}"
        NEXT_PUBLIC_API_URL="https://${DOMAIN}"
        ;;
      *)
        FRONTEND_URL="https://app.${DOMAIN}"
        BACKEND_URL="https://${DOMAIN}"
        SHORT_URL_DOMAIN="https://${DOMAIN}"
        NEXT_PUBLIC_API_URL="https://${DOMAIN}"
        ;;
    esac
  else
    DOMAIN=""
    FRONTEND_URL="http://localhost:4100"
    BACKEND_URL="http://localhost:4101"
    SHORT_URL_DOMAIN="http://localhost:4101"
    NEXT_PUBLIC_API_URL="http://localhost:4101"
  fi

  echo ""

  # Admin password
  echo "  ${BOLD}Admin Account${NC}"
  prompt ADMIN_PASSWORD "  Admin password (min 8 chars)" ""
  while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
    print_warn "Password must be at least 8 characters."
    prompt ADMIN_PASSWORD "  Admin password (min 8 chars)" ""
  done
  echo ""

  # Locale
  echo "  ${BOLD}Locale${NC}"
  prompt LOCALE "  UI language (en / zh-TW)" "en"
  echo ""

  # Brand name (optional)
  echo "  ${BOLD}Brand (optional, press Enter to skip)${NC}"
  prompt BRAND_NAME "  Brand name" "Open Short URL"
  echo ""

  # ========================================
  # Step 2: Generate secrets & config
  # ========================================
  print_step 2 "Generating secrets and configuration"

  JWT_SECRET=$(generate_secret 32)
  POSTGRES_PASSWORD=$(generate_secret 24)

  CORS_ORIGIN="$FRONTEND_URL"

  echo "  - JWT secret: generated"
  echo "  - Database password: generated"
  echo ""

  # ========================================
  # Step 3: Create files
  # ========================================
  print_step 3 "Creating deployment files"

  INSTALL_DIR="open-short-url"
  if [ -f "docker-compose.yml" ] && grep -q "open-short-url" docker-compose.yml 2>/dev/null; then
    INSTALL_DIR="."
  fi

  if [ "$INSTALL_DIR" != "." ]; then
    mkdir -p "$INSTALL_DIR"
  fi

  # --- docker-compose.yml ---
  cat > "${INSTALL_DIR}/docker-compose.yml" << 'COMPOSE_EOF'
# ============================================================
# Open Short URL - Docker Compose (GHCR Pre-built Images)
# ============================================================
# Generated by setup.sh
# ============================================================

services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-open_short_url}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/supra126/open-short-url-backend:latest
    restart: unless-stopped
    env_file:
      - path: .env
        required: true
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-open_short_url}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "${BACKEND_PORT:-4101}:4101"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    image: ghcr.io/supra126/open-short-url-frontend:latest
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:4101}
      NEXT_PUBLIC_SHORT_URL_DOMAIN: ${NEXT_PUBLIC_SHORT_URL_DOMAIN:-http://localhost:4101}
      NEXT_PUBLIC_LOCALE: ${NEXT_PUBLIC_LOCALE:-en}
      NEXT_PUBLIC_BRAND_NAME: ${NEXT_PUBLIC_BRAND_NAME:-Open Short URL}
      NEXT_PUBLIC_BRAND_ICON_URL: ${NEXT_PUBLIC_BRAND_ICON_URL:-}
      NEXT_PUBLIC_BRAND_DESCRIPTION: ${NEXT_PUBLIC_BRAND_DESCRIPTION:-}
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}
      NEXT_PUBLIC_DOCS_URL: ${NEXT_PUBLIC_DOCS_URL:-https://supra126.github.io/open-short-url/}
    ports:
      - "${FRONTEND_PORT:-4100}:4100"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
COMPOSE_EOF

  echo "  - docker-compose.yml created"

  # --- .env ---
  cat > "${INSTALL_DIR}/.env" << ENV_EOF
# ============================================================
# Open Short URL - Environment Configuration
# Generated by setup.sh on $(date '+%Y-%m-%d %H:%M:%S')
# ============================================================

# --- Infrastructure ---
POSTGRES_DB=open_short_url
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
BACKEND_PORT=4101
FRONTEND_PORT=4100

# --- Backend ---
NODE_ENV=production
PORT=4101
HOST=0.0.0.0
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ADMIN_INITIAL_PASSWORD=${ADMIN_PASSWORD}
SHORT_URL_DOMAIN=${SHORT_URL_DOMAIN}
FRONTEND_URL=${FRONTEND_URL}
CORS_ORIGIN=${CORS_ORIGIN}
TRUSTED_PROXY=true

# --- Frontend ---
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
NEXT_PUBLIC_SHORT_URL_DOMAIN=${SHORT_URL_DOMAIN}
NEXT_PUBLIC_LOCALE=${LOCALE}
NEXT_PUBLIC_BRAND_NAME=${BRAND_NAME}
NEXT_PUBLIC_BRAND_ICON_URL=
NEXT_PUBLIC_BRAND_DESCRIPTION=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_DOCS_URL=https://supra126.github.io/open-short-url/
ENV_EOF

  echo "  - .env created"
  echo ""

  # ========================================
  # Step 4: Start services
  # ========================================
  print_step 4 "Starting services"
  echo ""

  cd "$INSTALL_DIR"
  docker compose pull 2>&1 | grep -E "Pull|Pulled|Error" || true
  echo ""
  docker compose up -d 2>&1

  echo ""
  echo "  Waiting for services to be ready..."
  sleep 8

  # Check status
  BACKEND_OK=false
  FRONTEND_OK=false

  if curl -sf -o /dev/null "http://localhost:4101/api" 2>/dev/null; then
    BACKEND_OK=true
  fi
  if curl -sf -o /dev/null -w "" "http://localhost:4100" 2>/dev/null; then
    FRONTEND_OK=true
  fi

  echo ""
  echo "${GREEN}══════════════════════════════════════════${NC}"
  echo "${GREEN}  Setup complete!${NC}"
  echo "${GREEN}══════════════════════════════════════════${NC}"
  echo ""
  echo "  ${BOLD}Services:${NC}"

  if [ "$BACKEND_OK" = true ]; then
    echo "    ${GREEN}✓${NC} Backend:  ${BACKEND_URL:-http://localhost:4101}"
  else
    echo "    ${YELLOW}⏳${NC} Backend:  starting... (check: docker compose logs backend)"
  fi

  if [ "$FRONTEND_OK" = true ]; then
    echo "    ${GREEN}✓${NC} Frontend: ${FRONTEND_URL:-http://localhost:4100}"
  else
    echo "    ${YELLOW}⏳${NC} Frontend: starting... (check: docker compose logs frontend)"
  fi

  echo ""
  echo "  ${BOLD}Admin Login:${NC}"
  echo "    Email:    admin@example.com"
  echo "    Password: (the password you entered)"
  echo ""
  echo "  ${BOLD}Useful Commands:${NC}"
  echo "    docker compose ps        # Check service status"
  echo "    docker compose logs -f   # View logs"
  echo "    docker compose down      # Stop services"
  echo "    docker compose pull      # Update to latest version"
  echo ""

  if [ -n "$DOMAIN" ] && [ "$ACCESS_MODE" != "1" ]; then
    print_warn "You chose subdomain/path routing. Make sure to configure"
    print_warn "your reverse proxy (nginx/Caddy/Traefik) to route traffic"
    print_warn "to the correct ports (frontend: 4100, backend: 4101)."
    echo ""
  fi

  print_warn "Your secrets are stored in: $(pwd)/.env"
  print_warn "Keep this file safe and do not commit it to version control."
  echo ""
}

main "$@"
