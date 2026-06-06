#!/usr/bin/env bash

SEVEN_Z="/c/Program Files/NVIDIA Corporation/NVIDIA App/7z.exe"
SOURCE="E:/11照片/2026花盆/导出"
DEST="E:/11照片/2026花盆"
MAX_BYTES=$((95 * 1048576))

echo "=== 扫描文件 ==="
declare -a files=()
declare -a sizes=()
for f in "$SOURCE"/*.jpg; do
    sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
    files+=("$f")
    sizes+=($sz)
done
echo "文件数: ${#files[@]}"

echo "=== 分批压缩 (每包 < 95MB) ==="
batch_num=1
batch_files=()
batch_size=0

for i in "${!files[@]}"; do
    f="${files[$i]}"
    s="${sizes[$i]}"

    if [ $((batch_size + s)) -gt $MAX_BYTES ] && [ ${#batch_files[@]} -gt 0 ]; then
        zip_path="${DEST}/花盆导出_part${batch_num}.zip"
        printf "创建: 花盆导出_part%d.zip (%d 个文件, %d MB) ... " $batch_num ${#batch_files[@]} $((batch_size / 1048576))
        # Create zip with 7z
        "$SEVEN_Z" a -tzip -mx=5 "$zip_path" "${batch_files[@]}" > /dev/null 2>&1
        actual=$(( $(stat -c%s "$zip_path" 2>/dev/null || echo 0) / 1048576 ))
        echo "实际 ${actual} MB"
        batch_files=()
        batch_size=0
        batch_num=$((batch_num + 1))
    fi
    batch_files+=("$f")
    batch_size=$((batch_size + s))
done

# Last batch
if [ ${#batch_files[@]} -gt 0 ]; then
    zip_path="${DEST}/花盆导出_part${batch_num}.zip"
    printf "创建: 花盆导出_part%d.zip (%d 个文件, %d MB) ... " $batch_num ${#batch_files[@]} $((batch_size / 1048576))
    "$SEVEN_Z" a -tzip -mx=5 "$zip_path" "${batch_files[@]}" > /dev/null 2>&1
    actual=$(( $(stat -c%s "$zip_path" 2>/dev/null || echo 0) / 1048576 ))
    echo "实际 ${actual} MB"
fi

echo ""
echo "=== 完成，压缩包如下 ==="
ls -lh "${DEST}"/花盆导出_part*.zip 2>/dev/null
