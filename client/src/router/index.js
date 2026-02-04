import { createRouter, createWebHistory } from 'vue-router'
import Sign from '../views/public/Sign.vue'
import Register from '../views/public/Register.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'

const routes = [
  { path: '/', component: Sign },
  { path: '/sign', component: Sign },
  { path: '/register', component: Register },
  { path: '/admin/login', component: AdminLogin },
  { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next)=>{
  const token = localStorage.getItem('token')
  if (to.meta && to.meta.requiresAuth && !token) return next('/admin/login')
  next()
})

export default router
