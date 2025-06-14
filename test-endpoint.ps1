# Script de teste para depurar o problema do endpoint
$baseUrl = "https://artistry-dreamscape-ai.vercel.app"

Write-Host "🧪 TESTANDO ENDPOINT SIMPLES PRIMEIRO" -ForegroundColor Cyan
Write-Host "=== TESTE SIMPLES: POST para test-method ===" -ForegroundColor Yellow
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

Write-Host "`n🎯 TESTANDO ENDPOINT PRINCIPAL" -ForegroundColor Cyan

# Teste 1: POST sem trailing slash
Write-Host "=== TESTE 1: POST sem trailing slash ===" -ForegroundColor Yellow
try {
    $response1 = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate" -Method POST -ContentType "application/json" -Body '{"productId":"canvas_200x200_square_slim_unframed","userImageUrl":"https://example.com/test.jpg","userId":"test123"}' -UseBasicParsing
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response1.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n" 

# Teste 2: POST com trailing slash
Write-Host "=== TESTE 2: POST com trailing slash ===" -ForegroundColor Yellow
try {
    $response2 = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate/" -Method POST -ContentType "application/json" -Body '{"productId":"canvas_200x200_square_slim_unframed","userImageUrl":"https://example.com/test.jpg","userId":"test123"}' -UseBasicParsing
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response2.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Teste 3: GET para ver debug info
Write-Host "=== TESTE 3: GET para debug ===" -ForegroundColor Yellow
try {
    $response3 = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate" -Method GET -UseBasicParsing
    Write-Host "Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response3.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Teste 4: OPTIONS preflight
Write-Host "=== TESTE 4: OPTIONS preflight ===" -ForegroundColor Yellow
try {
    $response4 = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate" -Method OPTIONS -UseBasicParsing
    Write-Host "Status: $($response4.StatusCode)" -ForegroundColor Green
    Write-Host "Headers: $($response4.Headers | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Teste 5: POST com headers adicionais anti-cache
Write-Host "=== TESTE 5: POST com headers anti-cache ===" -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Cache-Control" = "no-cache, no-store, must-revalidate"
        "Pragma" = "no-cache"
        "Expires" = "0"
    }
    $response5 = Invoke-WebRequest -Uri "$baseUrl/api/printify/mockups/generate" -Method POST -Headers $headers -Body '{"productId":"canvas_200x200_square_slim_unframed","userImageUrl":"https://example.com/test.jpg","userId":"test123"}' -UseBasicParsing
    Write-Host "Status: $($response5.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response5.Content)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
} 