# PowerShell script to apply migration 12
# Usage: .\apply-migration-12.ps1
# Or: .\apply-migration-12.ps1 -DatabaseUrl "postgresql://..."

param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "==================================" -ForegroundColor Yellow
Write-Host "PostgreSQL 18 Compatibility Fix" -ForegroundColor Yellow
Write-Host "Migration 12 Application" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""

# Check if DATABASE_URL is set
if (-not $DatabaseUrl) {
    Write-Host "Error: DATABASE_URL not provided" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set it with:" -ForegroundColor Cyan
    Write-Host '  $env:DATABASE_URL = "postgresql://user:pass@host:5432/db?sslmode=require"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or run:" -ForegroundColor Cyan
    Write-Host '  .\apply-migration-12.ps1 -DatabaseUrl "postgresql://..."' -ForegroundColor Gray
    exit 1
}

# Check if psql is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "Error: psql not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install PostgreSQL:" -ForegroundColor Cyan
    Write-Host "  From: https://www.postgresql.org/download/" -ForegroundColor Gray
    Write-Host "  Ensure psql is in PATH" -ForegroundColor Gray
    exit 1
}

# Check if migration file exists
$migrationFile = "timeweb-migrations/12_fix_postgres18_compatibility_and_restore_import.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found: $migrationFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're running from project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Applying migration 12..." -ForegroundColor Cyan
Write-Host "Database URL: $($DatabaseUrl.Substring(0, [Math]::Min(30, $DatabaseUrl.Length)))..." -ForegroundColor Gray
Write-Host ""

# Apply migration
try {
    $output = psql $DatabaseUrl -f $migrationFile 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host "✓ Migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart backend API: npm run start" -ForegroundColor Gray
        Write-Host "2. Verify connection: curl http://localhost:3000/api/db-check" -ForegroundColor Gray
        Write-Host "3. Test post import functionality" -ForegroundColor Gray
        Write-Host ""
        Write-Host "For details, see: QUICK_START_FIXES.md" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "✗ Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error details:" -ForegroundColor Red
        $output | Select-Object -Last 20 | Write-Host
        Write-Host ""
        Write-Host "Full output saved to: migration_12.log" -ForegroundColor Yellow
        $output | Out-File -FilePath "migration_12.log"
        exit 1
    }
} catch {
    Write-Host "✗ Error running migration: $_" -ForegroundColor Red
    exit 1
}
