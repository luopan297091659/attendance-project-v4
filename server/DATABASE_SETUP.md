/**
 * 本地开发数据库配置说明
 * 
 * 系统需要 MySQL 数据库运行。目前有两个选项：
 */

// 选项1：本地 MySQL 服务器
// 请确保本地 MySQL 正在运行，然后使用以下配置：
// db.js 会自动连接到 localhost

// 选项2：远程 MySQL 服务器
// 修改 server/db.js 中的配置：
// host: '139.196.44.6'  (您的远程服务器地址)
// user: 'church_user'
// password: 'App@2026#Pwd'

// 选项3：使用 Docker 运行 MySQL
// 1. 安装 Docker
// 2. 运行以下命令启动 MySQL 容器：
//
// docker run --name mysql-church -e MYSQL_ROOT_PASSWORD=root123 \
//   -e MYSQL_DATABASE=church_db \
//   -p 3306:3306 -d mysql:5.7
//
// 3. 修改 db.js 配置为：
//    host: 'localhost'
//    user: 'root'
//    password: 'root123'
//    database: 'church_db'

// 当前状态：等待 MySQL 连接

console.log('请按照以下步骤操作：');
console.log('');
console.log('1. 安装并启动 MySQL 服务器');
console.log('   - Windows: 从 mysql.com 下载安装');
console.log('   - Mac: brew install mysql && brew services start mysql');
console.log('   - Linux: apt-get install mysql-server && systemctl start mysql');
console.log('');
console.log('2. 创建数据库和用户（可选，如果还没有）：');
console.log('   mysql -u root -p');
console.log('   CREATE DATABASE church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
console.log('   CREATE USER "root"@"localhost" IDENTIFIED BY "root123";');
console.log('   GRANT ALL PRIVILEGES ON church_db.* TO "root"@"localhost";');
console.log('   FLUSH PRIVILEGES;');
console.log('');
console.log('3. 修改 server/db.js 配置为您的 MySQL 连接参数');
console.log('');
console.log('4. 运行迁移脚本：');
console.log('   node scripts/migrate_church_system.js');
console.log('');
console.log('5. 启动后端：');
console.log('   node app.js');
