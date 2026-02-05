import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.css'
import router from './router'
import { setToken } from './api'

const token = localStorage.getItem('token')
if (token) setToken(token)

createApp(App).use(router).use(ElementPlus).mount('#app')
