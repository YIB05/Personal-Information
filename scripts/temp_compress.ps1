$source = 'E:\11照片\2026花盆\导出'
$destFolder = 'E:\11照片\2026花盆'
$maxSizeMB = 95

# List subdirectories with sizes
Write-Host "=== 子目录大小 ==="
$dirs = Get-ChildItem -LiteralPath $source -Directory | ForEach-Object {
    $size = (Get-ChildItem -LiteralPath $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
    [PSCustomObject]@{ Name = $_.Name; SizeMB = $size; Path = $_.FullName }
} | Sort-Object SizeMB -Descending

$dirs | ForEach-Object { Write-Host ('  {0,10:N1} MB  {1}' -f $_.SizeMB, $_.Name) }

# Group into batches under maxSizeMB
Write-Host "`n=== 开始压缩 ==="
$batch = @()
$batchSize = 0
$batchNum = 1

foreach ($dir in $dirs) {
    if (($batchSize + $dir.SizeMB) -gt $maxSizeMB -and $batch.Count -gt 0) {
        $zipName = "花盆导出_part$batchNum.zip"
        $zipPath = Join-Path $destFolder $zipName
        Write-Host "创建: $zipName (约 $([math]::Round($batchSize, 1)) MB)"
        $batch | ForEach-Object { Compress-Archive -LiteralPath $_.Path -DestinationPath $zipPath -Update }
        $batch = @()
        $batchSize = 0
        $batchNum++
    }
    $batch += $dir
    $batchSize += $dir.SizeMB
}

# Last batch
if ($batch.Count -gt 0) {
    $zipName = "花盆导出_part$batchNum.zip"
    $zipPath = Join-Path $destFolder $zipName
    Write-Host "创建: $zipName (约 $([math]::Round($batchSize, 1)) MB)"
    $batch | ForEach-Object { Compress-Archive -LiteralPath $_.Path -DestinationPath $zipPath -Update }
}

Write-Host "`n=== 完成 ==="
Write-Host "压缩包位于: $destFolder"
Get-ChildItem -LiteralPath $destFolder -Filter "花盆导出_part*.zip" | ForEach-Object {
    Write-Host ('  {0} ({1:N1} MB)' -f $_.Name, ($_.Length / 1MB))
}
