import { createRouter, createWebHistory } from 'vue-router'
import LeavesHistoryView from '../views/leaves/LeavesHistoryView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/pengaturan-slot-waktu',
      name: 'pengaturan-slot-waktu',
      component: () => import('@/views/schedules/PengaturanSlotWaktuView.vue'),
    },
    {
      path: '/penyusunan-jadwal',
      name: 'penyusunan-jadwal',
      component: () => import('@/views/schedules/PenyusunanJadwalView.vue'),
    },
    {
      path: '/slot-waktu',
      name: 'MasterSlotWaktu',
      component: () => import('@/views/schedules/MasterSlotWaktuView.vue'),
    },
    {
      path: '/leaves/history',
      name: 'leaves-history',
      component: LeavesHistoryView,
    },
    {
      path: '/leaves/request',
      name: 'leave-request',
      component: () => import('@/views/leaves/LeaveRequestView.vue'),
    },
    {
      path: '/reviews/periods',
      name: 'reviews-periods',
      component: () => import('@/views/reviews/ReviewManagementView.vue'),
    },
  ],
})

export default router
