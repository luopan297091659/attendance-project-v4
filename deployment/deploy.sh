#!/bin/bash

# 快速部署脚本 - Linux/MacOS版本

echo ""
echo "========================================"
echo "教会签到系统 v4.0 - 部署向导"
echo "========================================"
echo ""

# 检查Node.js
echo "[1/5] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js 未安装，请先安装 Node.js"
    echo "  访问: https://nodejs.org"
    exit 1
fi
echo "✓ Node.js 已安装 ($(node -v))"

# 检查MySQL
echo ""
echo "[2/5] 检查 MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "! MySQL 未在PATH中，但可能已安装"
    echo "  需要手动验证 MySQL 服务正在运行"
else
    echo "✓ MySQL 已安装"
fi

# 安装后端依赖
echo ""
echo "[3/5] 安装后端依赖..."
if [ -d "server/node_modules" ]; then
    echo "✓ 后端依赖已存在"
else
    cd server
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ 安装后端依赖失败"
        cd ..
        exit 1
    fi
    cd ..
    echo "✓ 后端依赖安装成功"
fi

# 检查客户端dist
echo ""
echo "[4/5] 检查前端构建文件..."
if [ -f "client-dist/index.html" ]; then
    echo "✓ 前端构建文件已存在"
else
    echo "✗ 前端构建文件未找到"
    echo "  需要先运行: npm run build (在client目录)"
    exit 1
fi

# 显示配置提示
echo ""
echo "[5/5] 配置提示..."
echo ""
echo "请确保已配置以下内容:"
echo "  1. 编辑 server/db.js 配置数据库连接"
echo "  2. 创建数据库并运行 init.sql"
echo "  3. 运行迁移脚本: node server/scripts/add_remark_column.js"
echo ""

# 启动服务
echo "========================================"
echo "准备启动服务..."
echo "========================================"
echo ""

cd server
echo "启动后端服务于 http://localhost:3000"
echo "按 Ctrl+C 停止服务"
echo ""

npm start
