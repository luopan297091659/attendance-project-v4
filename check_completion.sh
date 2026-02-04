#!/bin/bash
# 项目完整性检查脚本

echo "================================"
echo "  多教会签到系统升级完整性检查"
echo "================================"
echo ""

# 定义检查的文件列表
files=(
  "server/app.js"
  "server/db.js"
  "server/scripts/migrate_church_system.js"
  "server/scripts/init_test_data.js"
  "client/package.json"
  "client/src/views/admin/Dashboard.vue"
  "client/src/views/admin/AdminLogin.vue"
  "client/src/components/EmployeeList.vue"
  "client/src/components/EmployeeForm.vue"
  "client/src/components/ChurchManagement.vue"
  "UPGRADE_GUIDE.md"
  "QUICK_START.md"
  "IMPLEMENTATION_SUMMARY.md"
  "COMMANDS.md"
)

echo "检查核心文件..."
echo ""

missing=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (缺失)"
    ((missing++))
  fi
done

echo ""
echo "================================"

if [ $missing -eq 0 ]; then
  echo "✅ 所有文件都已创建！"
  echo ""
  echo "下一步操作："
  echo "1. 安装依赖: npm install (在 server 和 client 目录)"
  echo "2. 运行迁移: cd server && node scripts/migrate_church_system.js"
  echo "3. 初始化数据: node scripts/init_test_data.js"
  echo "4. 启动服务: node app.js"
  echo ""
  echo "详细说明请查看 QUICK_START.md"
else
  echo "❌ 有 $missing 个文件缺失"
  exit 1
fi

# 检查后端依赖
echo ""
echo "检查后端依赖..."
cd server
if [ -f "package.json" ]; then
  packages=("express" "cors" "dayjs" "jsonwebtoken" "bcryptjs" "mysql2" "exceljs")
  for pkg in "${packages[@]}"; do
    if grep -q "\"$pkg\"" package.json; then
      echo "✅ $pkg"
    else
      echo "⚠️  $pkg (需要通过 npm install 安装)"
    fi
  done
fi
cd ..

# 检查前端依赖
echo ""
echo "检查前端依赖..."
cd client
if [ -f "package.json" ]; then
  packages=("axios" "element-plus" "echarts" "qrcode" "vue" "vue-router" "xlsx")
  for pkg in "${packages[@]}"; do
    if grep -q "\"$pkg\"" package.json; then
      echo "✅ $pkg"
    else
      echo "⚠️  $pkg (需要通过 npm install 安装)"
    fi
  done
fi
cd ..

echo ""
echo "================================"
echo "检查完成！"
echo "================================"
