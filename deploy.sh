#!/bin/bash

# Microhire Westin Sales Portal — deploy static build to Azure Static Web Apps
# Target: microhire-westin-sales-portal (same subscription / RG as MicrohireAgentChat)
# Requires: Azure CLI (az), Node.js/npm, npx

set -e

RESOURCE_GROUP="rg-JennyJunkeer-9509"
STATIC_WEB_APP_NAME="microhire-westin-sales-portal"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying Microhire Sales Portal to Azure Static Web Apps..."

echo "🔐 Checking Azure CLI authentication..."
if ! az account show &> /dev/null; then
  echo "⚠️  Not authenticated. Running az login..."
  az login
fi

echo "🔍 Resolving Jenny Junkeer subscription..."
JENNY_SUB_ID=$(az account list --query "[?contains(user.name || '', 'JennyJunkeer') || contains(name || '', 'Jenny')].id" -o tsv | head -n 1)
CURRENT_SUB_ID=$(az account show --query id -o tsv)

if [ -n "$JENNY_SUB_ID" ] && [ "$CURRENT_SUB_ID" != "$JENNY_SUB_ID" ]; then
  echo "🔄 Switching subscription..."
  az account set --subscription "$JENNY_SUB_ID"
fi

if [ -z "$JENNY_SUB_ID" ]; then
  echo "❌ Could not find Jenny Junkeer subscription. Check az account list."
  exit 1
fi

echo "📋 Account: $(az account show --query user.name -o tsv)"
echo "📋 Subscription: $(az account show --query name -o tsv)"
echo ""

if ! az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  echo "❌ Static Web App '$STATIC_WEB_APP_NAME' not found in $RESOURCE_GROUP"
  exit 1
fi

cd "$SCRIPT_DIR"

echo "📦 npm ci..."
npm ci

echo "📦 npm run build (VITE_API_BASE_URL from .env.production)..."
npm run build

echo "🔑 Fetching deployment token from Azure (not stored in repo)..."
DEPLOY_TOKEN=$(az staticwebapp secrets list \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOY_TOKEN" ]; then
  echo "❌ Empty deployment token. Check permissions on the Static Web App."
  exit 1
fi

echo "☁️  Uploading dist/ via Azure Static Web Apps CLI..."
npx --yes @azure/static-web-apps-cli deploy ./dist \
  --deployment-token "$DEPLOY_TOKEN" \
  --env production

DEFAULT_HOST=$(az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)
echo ""
echo "✅ Deploy complete."
echo "🌐 Static Web App URL: https://${DEFAULT_HOST}"
echo "   (Production API is baked from .env.production → VITE_API_BASE_URL)"
