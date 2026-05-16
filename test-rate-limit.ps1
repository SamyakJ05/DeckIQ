# PowerShell test script for Windows
# Usage: .\test-rate-limit.ps1 <path-to-pdf-file>

param(
    [Parameter(Mandatory=$true)]
    [string]$PdfFile
)

if (-not (Test-Path $PdfFile)) {
    Write-Host "Error: File '$PdfFile' not found" -ForegroundColor Red
    exit 1
}

Write-Host "Testing rate limiting with file: $PdfFile" -ForegroundColor Cyan
Write-Host "Starting test at: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected behavior:" -ForegroundColor Yellow
Write-Host "- Sequential processing with 500ms delays"
Write-Host "- No 429 errors in logs"
Write-Host "- Processing time: ~16 seconds for 16 slides"
Write-Host ""

# Clear previous logs
Clear-Content -Path ".bob/log.md" -ErrorAction SilentlyContinue

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    $serverRunning = $true
} catch {
    Write-Host "Server not running. Please start with: npm run dev" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Sending request..." -ForegroundColor Cyan
$startTime = Get-Date

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$fileBin = [System.IO.File]::ReadAllBytes($PdfFile)
$fileName = [System.IO.Path]::GetFileName($PdfFile)

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: application/pdf",
    "",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBin),
    "--$boundary--"
)
$body = $bodyLines -join "`r`n"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/analyze" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body `
        -TimeoutSec 60

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host ""
    Write-Host "Test completed at: $(Get-Date)" -ForegroundColor Cyan
    Write-Host "Total duration: $([math]::Round($duration, 2))s" -ForegroundColor Cyan
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Save response
    $response.Content | Out-File -FilePath "response.json" -Encoding UTF8
    
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking logs for rate limit errors..." -ForegroundColor Cyan
Write-Host ""

# Check for 429 errors
$log429 = Select-String -Path ".bob/log.md" -Pattern "429" -ErrorAction SilentlyContinue
if ($log429) {
    Write-Host "❌ FAILED: Found 429 rate limit errors in logs" -ForegroundColor Red
    $log429 | Select-Object -First 5 | ForEach-Object { Write-Host $_.Line }
    exit 1
} else {
    Write-Host "✅ PASSED: No 429 rate limit errors found" -ForegroundColor Green
}

# Check for 404 errors
$log404 = Select-String -Path ".bob/log.md" -Pattern "404" -ErrorAction SilentlyContinue
if ($log404) {
    Write-Host "❌ FAILED: Found 404 model errors in logs" -ForegroundColor Red
    $log404 | Select-Object -First 5 | ForEach-Object { Write-Host $_.Line }
    exit 1
} else {
    Write-Host "✅ PASSED: No 404 model errors found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Response saved to: response.json" -ForegroundColor Cyan
Write-Host "Full logs available in: .bob/log.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Select-String -Path ".bob/log.md" -Pattern "(Starting NLU|NLU analysis complete|Starting Granite|Granite rubric scoring complete)" | 
    Select-Object -Last 10 | 
    ForEach-Object { Write-Host $_.Line }

# Made with Bob
