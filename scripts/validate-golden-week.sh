#!/bin/bash
# validate-golden-week.sh - Validate all golden week artifacts

set -euo pipefail

# Configuration
ARTIFACT_BASE="${ARTIFACT_BASE:-http://127.0.0.1:8081}"
WEEK="${1:-2025-06}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

# Golden week artifacts to validate
ARTIFACTS=(
  "data/stats/nfl/2025/week=${WEEK}/espn.json"
  "data/weather/nfl/2025/week=${WEEK}/games.json"
  "data/injuries/nfl/2025/week=${WEEK}/consensus.json"
  "data/usage/nfl/2025/week=${WEEK}/usage.json"
  "data/projections/nfl/2025/week=${WEEK}/baseline.json"
)

echo "Validating golden week artifacts for week=${WEEK}..."
echo ""

for artifact in "${ARTIFACTS[@]}"; do
  echo "Checking ${artifact}..."
  
  if curl -fsS "${ARTIFACT_BASE}/${artifact}" | jq -e '.schema_version and .last_refresh' >/dev/null 2>&1; then
    pass "${artifact}"
  else
    fail "${artifact} - missing schema_version or last_refresh"
  fi
done

echo ""
echo -e "${GREEN}All golden week artifacts validated!${NC}"

