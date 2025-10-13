#!/bin/bash

# Set the artifact base URL
ARTIFACT_BASE="https://pub-6de515c6d32f48829a452fd12addcad3.r2.dev"

# Define the array of file paths to validate
ks=(
  "data/stats/nfl/2025/week=2025-06/espn.json"
  "data/weather/nfl/2025/week=2025-06/games.json"
  "data/injuries/nfl/2025/week=2025-06/consensus.json"
  "data/usage/nfl/2025/week=2025-06/usage.json"
  "data/projections/nfl/2025/week=2025-06/baseline.json"
)

echo "Validating all files have required schema_version and last_refresh fields..."
echo "ARTIFACT_BASE: $ARTIFACT_BASE"
echo ""

for k in "${ks[@]}"; do
  echo "Checking: $k"
  resp=$(curl -fsS "${ARTIFACT_BASE}/${k}")
  echo "$resp" | jq -e 'type == "object" and .schema_version and .last_refresh' >/dev/null || {
    echo "ERROR: ${k} is missing required fields or is not an object"
    echo "$resp"
    exit 1
  }
  echo "✅ $k - Valid"
  echo ""
done

echo "🎉 All files validated successfully!"
