# Script de teste para endpoints locais
$baseUrl = "http://localhost:3000"

Write-Host "🏠 TESTANDO ENDPOINTS LOCAIS" -ForegroundColor Cyan

# Aguardar servidor iniciar
Start-Sleep -Seconds 5

# Teste 1: Endpoint simples
Write-Host "=== TESTE LOCAL 1: POST para test-method ===" -ForegroundColor Yellow
try {
    $responseTest = Invoke-WebRequest -Uri "$baseUrl/api/printify/test-method" -Method POST -ContentType "application/json" -Body '{"test":"data"}' -UseBasicParsing
    Write-Host "Status: $($responseTest.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($responseTest.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Teste 2: Endpoint principal com GET
Write-Host "=== TESTE LOCAL 2: GET para generate (debug) ===" -ForegroundColor Yellow
try {
    $responseGet = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate" -Method GET -UseBasicParsing
    Write-Host "Status: $($responseGet.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($responseGet.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Teste 3: Endpoint principal com POST
Write-Host "=== TESTE LOCAL 3: POST para generate ===" -ForegroundColor Yellow
try {
    $responsePost = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate" -Method POST -ContentType "application/json" -Body '{"productId":"canvas_200x200_square_slim_unframed","userImageUrl":"https://example.com/test.jpg","userId":"test123"}' -UseBasicParsing
    Write-Host "Status: $($responsePost.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($responsePost.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
} 