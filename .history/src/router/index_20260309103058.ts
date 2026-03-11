import { createRouter, createWebHistory } from 'vue-router'
import LeavesHistoryView from '../views/leaves/LeavesHistoryView.vue'

function getRoleFromToken(): string | null {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

const PUBLIC_ROUTES = ['/login']

function adminStaffOnly() {
  const role = getRoleFromToken()
  if (role !== 'Admin' && role !== 'Staff') {
    return { path: '/login' }
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
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

// Global auth guard: redirect to /login if no token and route is not public
router.beforeEach((to) => {
  const isPublic = PUBLIC_ROUTES.includes(to.path) || to.meta?.public === true
  const token = localStorage.getItem('token')
  if (!isPublic && !token) {
    return { name: 'login' }
  }
  // Prevent logged-in users from entering /login
  if (to.name === 'login' && token) {
    return { path: '/leaves/history' }
  }
})

export default router
