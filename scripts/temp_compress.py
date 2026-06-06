import os
import zipfile
import sys

source = r'E:\11照片\2026花盆\导出'
dest = r'E:\11照片\2026花盆'
max_size = 95 * 1024 * 1024  # 95MB for WeChat

# List subdirectories with sizes
print("=== 子目录大小 ===")
subdirs = []
for name in os.listdir(source):
    path = os.path.join(source, name)
    if os.path.isdir(path):
        total = 0
        for root, dirs, files in os.walk(path):
            for f in files:
                fp = os.path.join(root, f)
                try:
                    total += os.path.getsize(fp)
                except OSError:
                    pass
        subdirs.append((name, path, total))
        print(f"  {total / 1024 / 1024:10.1f} MB  {name}")

subdirs.sort(key=lambda x: x[2], reverse=True)

# Group into batches under max_size
print("\n=== 开始压缩 ===")
batches = []
current_batch = []
current_size = 0

for name, path, size in subdirs:
    if current_size + size > max_size and current_batch:
        batches.append(current_batch)
        current_batch = []
        current_size = 0
    current_batch.append((name, path, size))
    current_size += size

if current_batch:
    batches.append(current_batch)

for i, batch in enumerate(batches, 1):
    zip_name = f"花盆导出_part{i}.zip"
    zip_path = os.path.join(dest, zip_name)
    batch_size = sum(x[2] for x in batch) / 1024 / 1024
    print(f"创建: {zip_name} (约 {batch_size:.1f} MB) 包含: {[x[0] for x in batch]}")

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for name, path, size in batch:
            for root, dirs, files in os.walk(path):
                for f in files:
                    fp = os.path.join(root, f)
                    arcname = os.path.relpath(fp, os.path.dirname(path))
                    zf.write(fp, arcname)
    actual_size = os.path.getsize(zip_path) / 1024 / 1024
    print(f"  实际大小: {actual_size:.1f} MB")

print("\n=== 完成 ===")
