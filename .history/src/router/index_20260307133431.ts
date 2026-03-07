import { createRouter, createWebHistory } from "vue-router"
import LeavesHistoryView from '../views/leaves/LeavesHistoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/leaves/history",
      name: "leaves-history",
      component: LeavesHistoryView,
    },
    {
      path: "/leaves/request",
      name: "leave-request",
      component: () => import('@/views/leaves/LeaveRequestView.vue'),
    },
    {
      path: "/reviews/periods",
      name: "reviews-periods",
      component: () => import('@/views/reviews/ReviewManagementView.vue'),
    },
  ],
})

export default router
