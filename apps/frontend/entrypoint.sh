#!/bin/sh
# ============================================================
# Runtime environment variable replacement for Next.js
# ============================================================
# Replaces __PLACEHOLDER__ values baked at build time with
# actual environment variables at container startup.
# ============================================================

REPLACEMENTS=""

add_replacement() {
  local placeholder="$1"
  local env_value="$2"
  if [ -n "$env_value" ]; then
    # Escape sed delimiter and backslashes in the replacement value
    local escaped_value
    escaped_value=$(printf '%s\n' "$env_value" | sed 's/[\\|&]/\\&/g')
    REPLACEMENTS="${REPLACEMENTS}s|${placeholder}|${escaped_value}|g;"
  fi
}

add_replacement "__NEXT_PUBLIC_API_URL__" "$NEXT_PUBLIC_API_URL"
add_replacement "__NEXT_PUBLIC_SHORT_URL_DOMAIN__" "$NEXT_PUBLIC_SHORT_URL_DOMAIN"
add_replacement "__NEXT_PUBLIC_LOCALE__" "$NEXT_PUBLIC_LOCALE"
add_replacement "__NEXT_PUBLIC_BRAND_NAME__" "$NEXT_PUBLIC_BRAND_NAME"
add_replacement "__NEXT_PUBLIC_BRAND_ICON_URL__" "$NEXT_PUBLIC_BRAND_ICON_URL"
add_replacement "__NEXT_PUBLIC_BRAND_DESCRIPTION__" "$NEXT_PUBLIC_BRAND_DESCRIPTION"
add_replacement "__NEXT_PUBLIC_TURNSTILE_SITE_KEY__" "$NEXT_PUBLIC_TURNSTILE_SITE_KEY"

if [ -n "$REPLACEMENTS" ]; then
  find /app/apps/frontend/.next -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" -o -name "*.rsc" \) -exec sed -i "$REPLACEMENTS" {} +
fi

exec node apps/frontend/server.js
