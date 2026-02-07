@echo off
REM 快速部署脚本 - Windows版本

echo.
echo ========================================
echo 教会签到系统 v4.0 - 部署向导
echo ========================================
echo.

REM 检查Node.js
echo [1/5] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Node.js 未安装，请先安装 Node.js
    echo   访问: https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js 已安装

REM 检查MySQL
echo.
echo [2/5] 检查 MySQL...
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ! MySQL 未在PATH中，但可能已安装于本地
    echo   需要手动验证 MySQL 服务正在运行
)
echo ✓ MySQL 检查完成

REM 安装后端依赖
echo.
echo [3/5] 安装后端依赖...
if exist "server\node_modules" (
    echo ✓ 后端依赖已存在
) else (
    cd server
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ 安装后端依赖失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✓ 后端依赖安装成功
)

REM 检查客户端dist
echo.
echo [4/5] 检查前端构建文件...
if exist "client-dist\index.html" (
    echo ✓ 前端构建文件已存在
) else (
    echo ✗ 前端构建文件未找到
    echo   需要先运行: npm run build (在client目录)
    pause
    exit /b 1
)

REM 显示配置提示
echo.
echo [5/5] 配置提示...
echo.
echo 请确保已配置以下内容:
echo   1. 编辑 server\db.js 配置数据库连接
echo   2. 创建数据库并运行 init.sql
echo   3. 运行迁移脚本: node server\scripts\add_remark_column.js
echo.

REM 启动服务
echo ========================================
echo 准备启动服务...
echo ========================================
echo.

cd server
echo 启动后端服务于 http://localhost:3000
echo 按 Ctrl+C 停止服务
echo.

call npm start

pause
