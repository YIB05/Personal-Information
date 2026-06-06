$source = "E:/11照片/2026花盆/导出"
$dest = "E:/11照片/2026花盆"
Write-Host "Source: $source"
Write-Host "Dest: $dest"
if (Test-Path -LiteralPath $source) { Write-Host "EXISTS" } else { Write-Host "NOT FOUND" }
if (Test-Path -LiteralPath $dest) { Write-Host "Dest EXISTS" } else { Write-Host "Dest NOT FOUND" }
