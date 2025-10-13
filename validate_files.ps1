# PowerShell validation script equivalent to the bash script
$ARTIFACT_BASE = "https://pub-6de515c6d32f48829a452fd12addcad3.r2.dev"

# Define the array of file paths to validate
$ks = @(
    "data/stats/nfl/2025/week=2025-06/espn.json",
    "data/weather/nfl/2025/week=2025-06/games.json",
    "data/injuries/nfl/2025/week=2025-06/consensus.json",
    "data/usage/nfl/2025/week=2025-06/usage.json",
    "data/projections/nfl/2025/week=2025-06/baseline.json"
)

Write-Host "Validating all files have required schema_version and last_refresh fields..."
Write-Host "ARTIFACT_BASE: $ARTIFACT_BASE"
Write-Host ""

foreach ($k in $ks) {
    Write-Host "Checking: $k"
    try {
        $response = Invoke-WebRequest -Uri "$ARTIFACT_BASE/$k" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        
        # Check if it's an object and has the required fields
        if ($json.PSObject.TypeNames -contains "System.Management.Automation.PSCustomObject" -and 
            $json.schema_version -and $json.last_refresh) {
            Write-Host "✅ $k - Valid" -ForegroundColor Green
        } else {
            Write-Host "ERROR: $k is missing required fields or is not an object" -ForegroundColor Red
            Write-Host $response.Content
            exit 1
        }
    } catch {
        Write-Host "ERROR: Failed to fetch or parse $k" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
    Write-Host ""
}

Write-Host "🎉 All files validated successfully!" -ForegroundColor Green
