#!/bin/bash

# 遍历所有HTML文件
find src/html -name "*.html" -type f | while read file; do
  # 检查文件是否已经包含行为跟踪器
  if ! grep -q "behavior-tracker.js" "$file"; then
    # 在最后一个script标签前添加行为跟踪器
    sed -i '' '/<\/body>/i \
    <script src="/js/utils/behavior-tracker.js"></script>' "$file"
    echo "Added behavior tracker to $file"
  else
    echo "Behavior tracker already exists in $file"
  fi
done 