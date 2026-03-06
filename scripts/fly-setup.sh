#!/bin/sh
# ============================================================
# Open Short URL - Fly.io Setup Script
# ============================================================
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/fly-setup.sh)
#
# Or:
#   curl -fsSL -o fly-setup.sh https://raw.githubusercontent.com/supra126/open-short-url/main/scripts/fly-setup.sh
#   chmod +x fly-setup.sh && ./fly-setup.sh
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
  echo "${CYAN}║${NC}  ${BOLD}Open Short URL - Fly.io Setup${NC}           ${CYAN}║${NC}"
  echo "${CYAN}║${NC}  Deploy to Fly.io in minutes            ${CYAN}║${NC}"
  echo "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo ""
  echo "${GREEN}[${1}/${TOTAL_STEPS}]${NC} ${BOLD}${2}${NC}"
}

print_info() {
  echo "  ${GREEN}✓${NC} ${1}"
}

print_warn() {
  echo "  ${YELLOW}!${NC} ${1}"
}

print_error() {
  echo "  ${RED}✗${NC} ${1}"
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

# --- Generate random string ---
generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 "$1" 2>/dev/null | tr -d '\n'
  else
    head -c 64 /dev/urandom | base64 | tr -d '\n/+=' | head -c "$1"
  fi
}

# --- Cleanup temp files on exit ---
cleanup() {
  rm -f /tmp/osu-fly-backend.toml /tmp/osu-fly-frontend.toml
}
trap cleanup EXIT

# --- Pre-flight checks ---
check_requirements() {
  local has_error=false

  if command -v fly >/dev/null 2>&1; then
    print_info "flyctl found: $(fly version 2>/dev/null | head -1)"
  elif command -v flyctl >/dev/null 2>&1; then
    print_info "flyctl found: $(flyctl version 2>/dev/null | head -1)"
    alias fly=flyctl
  else
    print_error "flyctl is not installed. Install it first:"
    echo "    https://fly.io/docs/flyctl/install/"
    has_error=true
  fi

  if [ "$has_error" = false ]; then
    if fly auth whoami >/dev/null 2>&1; then
      print_info "Logged in as: $(fly auth whoami 2>/dev/null)"
    else
      print_error "Not logged in to Fly.io. Run: fly auth login"
      has_error=true
    fi
  fi

  if [ "$has_error" = true ]; then
    echo ""
    exit 1
  fi
}

# --- Download and patch toml ---
download_toml() {
  local name="$1"     # backend or frontend
  local app_name="$2"
  local region="$3"
  local output="/tmp/osu-fly-${name}.toml"

  if ! curl -fsSL "${REPO_URL}/.fly/${name}.toml" -o "$output" 2>/dev/null; then
    print_error "Failed to download ${name}.toml from repository"
    exit 1
  fi

  # Patch app name and region (escape sed special chars)
  local escaped_app
  escaped_app=$(printf '%s\n' "$app_name" | sed 's/[\/&'"'"']/\\&/g')
  local escaped_region
  escaped_region=$(printf '%s\n' "$region" | sed 's/[\/&'"'"']/\\&/g')
  sed -i.bak "s/^app = .*/app = '${escaped_app}'/" "$output"
  sed -i.bak "s/^primary_region = .*/primary_region = '${escaped_region}'/" "$output"
  rm -f "${output}.bak"
}

# --- Check if Fly app exists ---
app_exists() {
  fly apps list 2>/dev/null | awk -v name="$1" '$1 == name {found=1} END {exit !found}'
}

# --- Main ---
main() {
  print_banner
  check_requirements

  # ========================================
  # Step 1: Collect user input
  # ========================================
  TOTAL_STEPS=5

  print_step 1 "Configure your instance"
  echo ""

  # App name prefix
  prompt APP_PREFIX "  App name prefix" "open-short-url"
  BACKEND_APP="${APP_PREFIX}-backend"
  FRONTEND_APP="${APP_PREFIX}-frontend"
  DB_APP="${APP_PREFIX}-db"
  echo ""
  echo "  Apps to create:"
  echo "    Backend:  ${BOLD}${BACKEND_APP}${NC}"
  echo "    Frontend: ${BOLD}${FRONTEND_APP}${NC}"
  echo "    Postgres: ${BOLD}${DB_APP}${NC}"
  echo ""

  # Region
  echo "  ${BOLD}Region${NC}"
  echo "  Common: nrt (Tokyo), sin (Singapore), hkg (Hong Kong),"
  echo "          sea (Seattle), iad (Virginia), lhr (London)"
  prompt REGION "  Primary region" "nrt"
  echo ""

  # Frontend deployment
  echo "  ${BOLD}Frontend deployment${NC}"
  echo "  ${CYAN}1)${NC} Fly.io  (full-stack on Fly)"
  echo "  ${CYAN}2)${NC} Vercel  (backend only on Fly)"
  echo ""
  prompt FRONTEND_MODE "  Choose [1/2]" "1"
  echo ""

  # Admin password
  echo "  ${BOLD}Admin Account${NC}"
  prompt ADMIN_PASSWORD "  Admin password (min 8 chars)" ""
  while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
    print_warn "Password must be at least 8 characters."
    prompt ADMIN_PASSWORD "  Admin password (min 8 chars)" ""
  done
  echo ""

  # Frontend URL for CORS
  if [ "$FRONTEND_MODE" = "2" ]; then
    prompt CUSTOM_FRONTEND_URL "  Vercel frontend URL (e.g. https://app.example.com)" ""
    FRONTEND_URL="$CUSTOM_FRONTEND_URL"
  else
    FRONTEND_URL="https://${FRONTEND_APP}.fly.dev"
  fi

  BACKEND_URL="https://${BACKEND_APP}.fly.dev"

  # ========================================
  # Step 2: Download config files
  # ========================================
  print_step 2 "Downloading configuration"

  download_toml "backend" "$BACKEND_APP" "$REGION"
  print_info "backend.toml downloaded and patched"

  if [ "$FRONTEND_MODE" = "1" ]; then
    download_toml "frontend" "$FRONTEND_APP" "$REGION"
    print_info "frontend.toml downloaded and patched"
  fi

  # ========================================
  # Step 3: Deploy backend
  # ========================================
  print_step 3 "Deploying backend"

  # Create app if not exists
  if app_exists "$BACKEND_APP"; then
    print_warn "${BACKEND_APP} already exists, skipping creation"
  else
    echo ""
    fly apps create "$BACKEND_APP" --org personal 2>&1 | sed 's/^/  /'
    print_info "App ${BACKEND_APP} created"
  fi

  # Create Postgres if not exists
  if app_exists "$DB_APP"; then
    print_warn "${DB_APP} already exists, skipping creation"
  else
    echo ""
    echo "  Creating Postgres cluster (this may take a minute)..."
    fly postgres create \
      --name "$DB_APP" \
      --region "$REGION" \
      --vm-size shared-cpu-1x \
      --initial-cluster-size 1 \
      --volume-size 1 2>&1 | sed 's/^/  /'
    print_info "Postgres ${DB_APP} created"
  fi

  # Attach Postgres
  echo ""
  echo "  Attaching Postgres to backend..."
  fly postgres attach "$DB_APP" -a "$BACKEND_APP" 2>&1 | sed 's/^/  /' || true
  print_info "Postgres attached (DATABASE_URL set automatically)"

  # Set secrets
  JWT_SECRET=$(generate_secret 32)
  echo ""
  echo "  Setting secrets..."
  fly secrets set -a "$BACKEND_APP" \
    JWT_SECRET="$JWT_SECRET" \
    ADMIN_INITIAL_PASSWORD="$ADMIN_PASSWORD" \
    SHORT_URL_DOMAIN="$BACKEND_URL" \
    FRONTEND_URL="$FRONTEND_URL" \
    CORS_ORIGIN="$FRONTEND_URL" 2>&1 | sed 's/^/  /'
  print_info "Secrets configured"

  # Deploy
  echo ""
  echo "  Deploying backend (pulling image from GHCR)..."
  echo ""
  fly deploy -c /tmp/osu-fly-backend.toml 2>&1 | sed 's/^/  /'
  print_info "Backend deployed: ${BACKEND_URL}"

  # ========================================
  # Step 4: Deploy frontend
  # ========================================
  if [ "$FRONTEND_MODE" = "1" ]; then
    print_step 4 "Deploying frontend"

    # Create app if not exists
    if app_exists "$FRONTEND_APP"; then
      print_warn "${FRONTEND_APP} already exists, skipping creation"
    else
      echo ""
      fly apps create "$FRONTEND_APP" --org personal 2>&1 | sed 's/^/  /'
      print_info "App ${FRONTEND_APP} created"
    fi

    # Set secrets
    echo ""
    echo "  Setting secrets..."
    fly secrets set -a "$FRONTEND_APP" \
      NEXT_PUBLIC_API_URL="$BACKEND_URL" \
      NEXT_PUBLIC_SHORT_URL_DOMAIN="$BACKEND_URL" 2>&1 | sed 's/^/  /'
    print_info "Secrets configured"

    # Deploy
    echo ""
    echo "  Deploying frontend (pulling image from GHCR)..."
    echo ""
    fly deploy -c /tmp/osu-fly-frontend.toml 2>&1 | sed 's/^/  /'
    print_info "Frontend deployed: ${FRONTEND_URL}"
  else
    print_step 4 "Skipping frontend (using Vercel)"
    print_info "Backend CORS configured for: ${FRONTEND_URL}"
  fi

  # ========================================
  # Step 5: Summary
  # ========================================
  print_step 5 "Done!"
  echo ""
  echo "${GREEN}══════════════════════════════════════════${NC}"
  echo "${GREEN}  Deployment complete!${NC}"
  echo "${GREEN}══════════════════════════════════════════${NC}"
  echo ""
  echo "  ${BOLD}Services:${NC}"
  echo "    Backend:  ${BACKEND_URL}"
  echo "    API Docs: ${BACKEND_URL}/api"
  if [ "$FRONTEND_MODE" = "1" ]; then
    echo "    Frontend: ${FRONTEND_URL}"
  else
    echo "    Frontend: ${FRONTEND_URL} (Vercel - deploy separately)"
  fi
  echo ""
  echo "  ${BOLD}Admin Login:${NC}"
  echo "    Email:    admin@example.com"
  echo "    Password: (the password you entered)"
  echo ""
  echo "  ${BOLD}Useful Commands:${NC}"
  echo "    fly status -a ${BACKEND_APP}       # Backend status"
  echo "    fly logs -a ${BACKEND_APP}         # Backend logs"
  if [ "$FRONTEND_MODE" = "1" ]; then
    echo "    fly status -a ${FRONTEND_APP}      # Frontend status"
    echo "    fly logs -a ${FRONTEND_APP}        # Frontend logs"
  fi
  echo "    fly postgres connect -a ${DB_APP}  # Connect to DB"
  echo ""
  print_warn "Change the default admin password after first login."
  echo ""
}

main "$@"
