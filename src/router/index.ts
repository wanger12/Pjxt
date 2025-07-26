import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // 重定向到产品报价页面
      redirect: '/product-quote',
    },
    {
      path: '/product-quote',
      name: 'product-quote',
      component: () => import('@/views/quoting/ProductQuotation.vue'),
    },
    {
      path: '/accessory-quote',
      name: 'accessory-quote',
      component: () => import('@/views/quoting/AccessoriesQuotation.vue'),
    },
  ],
})

export default router
