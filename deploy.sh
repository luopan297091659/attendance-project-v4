#!/bin/bash

# 考勤签到系统 - 快速部署脚本
# 使用方式：bash deploy.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     考勤签到系统 - 快速部署脚本 v4.0                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 错误处理
error_exit() {
    echo -e "${RED}✗ 错误: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 步骤 1: 检查环境
echo ""
echo "步骤 1/6: 检查环境..."

command -v node > /dev/null 2>&1 || error_exit "Node.js 未安装"
command -v npm > /dev/null 2>&1 || error_exit "npm 未安装"
command -v mysql > /dev/null 2>&1 || error_exit "MySQL 未安装"

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

success "Node.js 版本: $NODE_VERSION"
success "npm 版本: $NPM_VERSION"

# 步骤 2: 安装后端依赖
echo ""
echo "步骤 2/6: 安装后端依赖..."

if [ ! -d "server/node_modules" ]; then
    cd server
    npm install || error_exit "后端依赖安装失败"
    cd ..
    success "后端依赖已安装"
else
    info "后端依赖已存在，跳过安装"
fi

# 步骤 3: 初始化数据库
echo ""
echo "步骤 3/6: 初始化数据库..."

read -p "请输入 MySQL root 密码: " -s MYSQL_PASS
echo ""

mysql -u root -p"$MYSQL_PASS" < server/sql/init.sql || error_exit "数据库初始化失败"
success "数据库已初始化"

# 步骤 4: 配置环境变量
echo ""
echo "步骤 4/6: 配置环境变量..."

if [ ! -f "server/.env" ]; then
    cat > server/.env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=$MYSQL_PASS
DB_NAME=church_db
NODE_ENV=production
PORT=3000
EOF
    success "环境变量配置已创建"
else
    info "环境变量文件已存在"
fi

# 步骤 5: 启动后端服务
echo ""
echo "步骤 5/6: 启动后端服务..."

cd server

# 检查是否已安装 pm2
if ! npm list -g pm2 > /dev/null 2>&1; then
    info "安装 pm2..."
    npm install -g pm2 || error_exit "pm2 安装失败"
fi

# 启动应用
pm2 delete attendance-server 2>/dev/null || true
pm2 start app.js --name "attendance-server" --node-args="--max-old-space-size=2048" || error_exit "后端启动失败"
pm2 startup || true
pm2 save || true

success "后端已启动"

cd ..

# 步骤 6: 前端部署说明
echo ""
echo "步骤 6/6: 前端部署..."

if [ -d "client/dist" ]; then
    success "前端已构建，文件位置: client/dist/"
    echo ""
    echo "前端文件大小:"
    du -sh client/dist/
else
    error_exit "前端未构建，请先运行: cd client && npm install && npm run build"
fi

# 完成提示
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    部署完成！                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "后端状态:"
pm2 status
echo ""
echo "🎯 后端访问地址: http://localhost:3000"
echo ""
echo "前端部署方案:"
echo "  1. 使用 Nginx 代理:"
echo "     - 将 client/dist 目录配置为 web root"
echo "     - 配置 /api 代理到 http://localhost:3000"
echo ""
echo "  2. 使用 Docker:"
echo "     - docker-compose up -d"
echo ""
echo "📝 详见部署指南: DEPLOYMENT_GUIDE.md"
echo ""
echo "⚙️ 后端进程管理:"
echo "   pm2 logs attendance-server     # 查看日志"
echo "   pm2 restart attendance-server  # 重启服务"
echo "   pm2 stop attendance-server     # 停止服务"
echo ""
