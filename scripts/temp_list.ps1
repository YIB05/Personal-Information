# List subdirectories of E:\11照片\
$parent = 'E:\11照片\'
Write-Host "=== E:\11照片\ 下的子目录 ==="
$subdirs = Get-ChildItem -LiteralPath $parent -Directory
foreach ($d in $subdirs) {
    Write-Host $d.Name
}

# Check if 2026花盆 exists
$target = Join-Path $parent '2026花盆'
if (Test-Path -LiteralPath $target) {
    Write-Host "`n=== 2026花盆 下的子目录 ==="
    Get-ChildItem -LiteralPath $target -Directory | ForEach-Object { Write-Host $_.Name }

    $export = Join-Path $target '导出'
    if (Test-Path -LiteralPath $export) {
        Write-Host "`n=== 导出 目录内容 ==="
        $subExport = Get-ChildItem -LiteralPath $export -Directory
        $fileCount = (Get-ChildItem -LiteralPath $export -Recurse -File).Count
        $totalSize = [math]::Round((Get-ChildItem -LiteralPath $export -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 2)
        Write-Host "子目录数: $($subExport.Count)"
        Write-Host "文件总数: $fileCount"
        Write-Host "总大小: $totalSize MB"
        Write-Host "`n子目录:"
        foreach ($sd in $subExport) {
            $sz = [math]::Round((Get-ChildItem -LiteralPath $sd.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 2)
            Write-Host "  $($sd.Name) - $sz MB"
        }
    } else {
        Write-Host "导出 目录不存在"
        # Check what's in 2026花盆
        Write-Host "`n2026花盆 目录内容:"
        Get-ChildItem -LiteralPath $target -Directory | ForEach-Object { Write-Host $_.Name }
        Get-ChildItem -LiteralPath $target -File | ForEach-Object { Write-Host "$($_.Name) ($([math]::Round($_.Length/1MB, 2)) MB)" }
    }
} else {
    Write-Host "2026花盆 目录不存在"
}
