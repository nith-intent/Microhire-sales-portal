#!/usr/bin/env bash
#
# Microhire Sales Portal — Hostinger deployment.
#
# What it does:
#   1. Verifies the SSH host alias `hostinger-intent` is reachable.
#   2. Builds the Vite SPA (`npm run build`). Uses VITE_API_BASE_URL from
#      .env.production and the `/portal/` base path from vite.config.ts.
#   3. Backs up the current web root on the server.
#   4. Rsyncs dist/ to /var/www/microhire-sales-portal/ (with --delete).
#   5. Smoke-tests the public URL.
#
# Idempotent: re-run any time after editing source. Previous web roots are
# kept as /var/www/microhire-sales-portal.bak.<timestamp> for rollback.
#
# Requires (local): node + npm, rsync, ssh
# Requires (remote): nginx already configured to serve
#                    /var/www/microhire-sales-portal/ at https://.../portal/

set -euo pipefail

# -------- config --------
SSH_HOST="hostinger-intent"
REMOTE_WEBROOT="/var/www/microhire-sales-portal"
PUBLIC_URL="https://microhire.intent-dev.cloud/portal/"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${REMOTE_WEBROOT}.bak.${TIMESTAMP}"

# -------- helpers --------
log()  { printf '\033[1;34m[%s]\033[0m %s\n' "$(date +%H:%M:%S)" "$*"; }
ok()   { printf '\033[1;32m✅ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠️  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m❌ %s\033[0m\n' "$*" >&2; exit 1; }

# -------- pre-flight --------
log "Checking SSH connectivity to ${SSH_HOST}…"
ssh -o ConnectTimeout=8 -o BatchMode=yes "$SSH_HOST" 'true' \
  || die "Can't reach ${SSH_HOST}. Check ~/.ssh/config + keys."

log "Checking remote web root exists…"
ssh "$SSH_HOST" "test -d ${REMOTE_WEBROOT}" \
  || die "Remote web root missing: ${REMOTE_WEBROOT}. nginx site may not be configured."

# -------- build --------
log "Building SPA (npm run build)…"
(
  cd "$SCRIPT_DIR"
  npm run build 2>&1 | tail -8
)
[ -f "$DIST_DIR/index.html" ] || die "Build failed: dist/index.html missing."

# Verify the built bundle uses /portal/ base (catches accidental vite.config revert).
if ! grep -q '/portal/assets/' "$DIST_DIR/index.html"; then
  die "Built index.html doesn't reference /portal/assets/. vite.config.ts may have been reverted to base:'/'."
fi
ok "Built SPA with /portal/ base path."

# -------- backup + upload --------
log "Backing up current web root → ${BACKUP_DIR}…"
ssh "$SSH_HOST" "cp -a ${REMOTE_WEBROOT} ${BACKUP_DIR}"

log "Rsyncing dist/ → ${SSH_HOST}:${REMOTE_WEBROOT}/ (with --delete)…"
rsync -az --delete "${DIST_DIR}/" "${SSH_HOST}:${REMOTE_WEBROOT}/" \
  || die "Rsync failed; old build still in place."

# -------- health check --------
log "Smoke-testing public URL…"
HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${PUBLIC_URL}" || echo "000")"
if [ "$HTTP_CODE" = "200" ]; then
  ok "Public URL responds: HTTP 200"
else
  warn "Public URL returned HTTP ${HTTP_CODE} — check nginx logs on server."
fi

# Verify asset is fetchable too (catches bad nginx alias / base path mismatch)
ASSET_NAME="$(grep -oE '/portal/assets/[^"]+\.js' "$DIST_DIR/index.html" | head -1)"
if [ -n "$ASSET_NAME" ]; then
  ASSET_URL="https://microhire.intent-dev.cloud${ASSET_NAME}"
  ASSET_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$ASSET_URL" || echo "000")"
  if [ "$ASSET_CODE" = "200" ]; then
    ok "Hashed JS asset reachable: ${ASSET_URL}"
  else
    warn "JS asset returned HTTP ${ASSET_CODE} — check nginx alias mapping for ${REMOTE_WEBROOT}."
  fi
fi

# -------- done --------
cat <<EOF

🎉 Deploy complete.
   Web root:  ${REMOTE_WEBROOT}
   Backup:    ${BACKUP_DIR}
   Public:    ${PUBLIC_URL}

Rollback (if needed):
  ssh ${SSH_HOST} "rm -rf ${REMOTE_WEBROOT} && mv ${BACKUP_DIR} ${REMOTE_WEBROOT}"
EOF
