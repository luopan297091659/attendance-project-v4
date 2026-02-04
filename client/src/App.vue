<template>
  <div id="app">
    <el-container>
      <el-header v-if="!isAdminPage">
        <el-row type="flex" justify="space-between">
          <div><strong>签到系统</strong></div>
          <div>
            <el-button type="text" @click="go('/admin')">管理员</el-button>
            <el-button type="text" @click="logout" v-if="token">退出</el-button>
            <el-button type="text" @click="go('/')">签到</el-button>
          </div>
        </el-row>
      </el-header>
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
