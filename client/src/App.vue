<template>
  <div id="app">
    <el-container>
      <!-- header已隐藏 - 仅在管理员页面显示 -->
      <!-- <el-header v-if="!isAdminPage">
        <el-row type="flex" justify="space-between">
          <div><strong>签到系统</strong></div>
          <div>
            <el-button type="text" @click="go('/admin')">管理员</el-button>
            <el-button type="text" @click="logout" v-if="token">退出</el-button>
            <el-button type="text" @click="go('/')">签到</el-button>
          </div>
        </el-row>
      </el-header> -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { getCurrentInstance } from 'vue'
import { setToken } from './api'
export default {
  data(){ return { token: localStorage.getItem('token') }
  },
  computed: {
    isAdminPage() {
      return location.pathname.startsWith('/admin')
    }
  },
  created(){ setToken(this.token) },
  methods:{ go(p){ location.href=p }, logout(){ localStorage.removeItem('token'); setToken(null); this.token=null; location.href='/' } }
}
</script>

<style>
/* 全局响应式样式 */
* {
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
  overflow-x: hidden;
}

#app {
  display: flex;
  flex-direction: column;
}

/* Element Plus容器优化 */
.el-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.el-main {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 防止iOS缩放 */
input[type='text'],
input[type='email'],
input[type='password'],
input[type='number'],
textarea,
select {
  font-size: 16px;
  -webkit-user-select: text;
  user-select: text;
}

/* 禁用双击放大 */
button,
a,
input[type='submit'],
input[type='button'] {
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  body {
    background-color: #fafafa;
  }
}

/* 手机屏幕优化 */
@media (max-width: 767px) {
  body {
    background-color: white;
  }

  .el-main {
    padding: 0;
  }
}

/* 横屏手机优化 */
@media (max-height: 500px) {
  body {
    overflow-y: auto;
  }

  #app {
    min-height: 100vh;
  }
}

/* iOS Safari 特定优化 */
@supports (-webkit-touch-callout: none) {
  body {
    /* 防止iOS键盘出现时页面滚动 */
    position: fixed;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  #app {
    position: fixed;
    width: 100%;
    height: 100vh;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .el-main {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
