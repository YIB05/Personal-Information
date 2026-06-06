#!/usr/bin/env bash

SOURCE="E:/11照片/2026花盆/导出"
NUM_FOLDERS=6

echo "=== 创建文件夹 ==="
for i in $(seq 1 $NUM_FOLDERS); do
    folder="${SOURCE}_$(printf '%02d' $i)"
    mkdir -p "$folder"
    echo "  $folder"
done

echo "=== 按大小分配文件 ==="

# Get files sorted by size (largest first)
declare -a files=()
declare -a sizes=()
for f in "$SOURCE"/*.jpg; do
    sz=$(stat -c%s "$f")
    files+=("$f")
    sizes+=($sz)
done

# Initialize folder sizes
declare -a folder_sizes=()
for i in $(seq 0 $((NUM_FOLDERS - 1))); do
    folder_sizes[$i]=0
done

# For each file, put it in the smallest folder (greedy bin packing)
total=${#files[@]}
for idx in "${!files[@]}"; do
    f="${files[$idx]}"
    s="${sizes[$idx]}"

    # Find folder with smallest total
    min_sz=999999999999
    min_i=0
    for i in $(seq 0 $((NUM_FOLDERS - 1))); do
        if [ ${folder_sizes[$i]} -lt $min_sz ]; then
            min_sz=${folder_sizes[$i]}
            min_i=$i
        fi
    done

    # Move file
    dest_folder="${SOURCE}_$(printf '%02d' $((min_i + 1)))"
    mv "$f" "$dest_folder/"
    folder_sizes[$min_i]=$((folder_sizes[$min_i] + s))
done

echo ""
echo "=== 分配结果 ==="
for i in $(seq 1 $NUM_FOLDERS); do
    folder="${SOURCE}_$(printf '%02d' $i)"
    count=$(ls "$folder"/*.jpg 2>/dev/null | wc -l)
    size=$((folder_sizes[$((i-1))] / 1048576))
    echo "  导出_$(printf '%02d' $i): ${count} 个文件, ${size} MB"
done
