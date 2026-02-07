# PowerShell script to fix remaining createServerClient calls

$files = @(
    "app\api\posts\[slug]\shares\route.ts",
    "app\api\posts\[slug]\saves\route.ts",
    "app\api\posts\[slug]\likes\route.ts",
    "app\api\posts\[slug]\comments\[id]\route.ts",
    "app\api\posts\[slug]\comments\route.ts",
    "app\api\lessons\[id]\route.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $updated = $content -replace 'const supabase = createServerClient\(', 'const supabase = await createServerClient('
        Set-Content $fullPath $updated -NoNewline
        Write-Host "Fixed: $file"
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nAll files processed!" -ForegroundColor Green
