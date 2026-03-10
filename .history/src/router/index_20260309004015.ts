import { createRouter, createWebHistory } from 'vue-router'
import LeavesHistoryView from '../views/leaves/LeavesHistoryView.vue'

function getRoleFromToken(): string | null {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

function adminStaffOnly() {
  const role = getRoleFromToken()
  if (role !== 'Admin' && role !== 'Staff') {
    return { path: '/' }
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      beforeEnter: adminStaffOnly,
    },
    {
      path: '/reviews/periods/:periodId',
      name: 'reviews-period-detail',
      component: () => import('@/views/reviews/ReviewPeriodDetailView.vue'),
      beforeEnter: adminStaffOnly,
    },
    {
      path: '/reviews/periods/:periodId/teachers/:teacherId/assign',
      name: 'reviews-assign',
      component: () => import('@/views/reviews/ReviewAssignmentConfigView.vue'),
      beforeEnter: adminStaffOnly,
    },
  ],
})

export default router
