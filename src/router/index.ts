import { createRouter, createWebHistory } from 'vue-router'
import StoplossOptimizerPage from '../views/StoplossOptimizerPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'stoploss-optimizer',
      component: StoplossOptimizerPage,
    },
  ],
})

export default router
