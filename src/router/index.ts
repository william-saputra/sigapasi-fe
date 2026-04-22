import { createRouter, createWebHistory } from 'vue-router'
import LeavesHistoryView from '../views/leaves/LeavesHistoryView.vue'
import HomeView from '../views/HomeView.vue'

function getRoleFromToken(): string | null {
  try {
    const token = localStorage.getItem('token');

    // 1. Cek apakah token ada
    if (!token) return null;

    // 2. Pecah string JWT
    const parts = token.split('.');

    // 3. Ambil bagian payload (indeks ke-1)
    // Kita simpan ke variabel dan pastikan ada isinya
    const payloadPart = parts[1];

    if (!payloadPart) return null;

    // 4. Decode menggunakan atob.
    // Kita beritahu TS bahwa payloadPart pasti string pakai "as string"
    // atau biarkan pengecekan if di atas bekerja.
    const decodedPayload = JSON.parse(atob(payloadPart));

    return decodedPayload.role ?? null;
  } catch (error) {
    return null;
  }
}

function adminStaffOnly() {
  const role = getRoleFromToken()
  if (role !== 'ADMIN' && role !== 'STAFF') {
    return { path: '/' }
  }
}

function teacherOnly() {
  const role = getRoleFromToken()
  // Kita gunakan toUpperCase agar lebih aman terhadap perbedaan case dari backend
  if (role?.toUpperCase() !== 'TEACHER') {
    return { path: '/' } // Tendang ke home kalau bukan teacher
  }
}



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/home',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
    },
    {
      path: '/account/:id',
      name: 'account-detail',
      component: () => import('@/views/accounts/AccountDetailView.vue'),
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('@/views/accounts/ListAccountView.vue'),
    },
    {
      path: '/account/create',
      name: 'account-create',
      component: () => import('@/views/accounts/AccountFormView.vue'),
    },
    {
      path: '/account/edit/:id',
      name: 'account-edit',
      component: () => import('@/views/accounts/AccountFormView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/jadwal',
      name: 'jadwal-dashboard',
      component: () => import('@/views/schedules/JadwalMainView.vue'),
    },
    {
      path: '/pengaturan-slot-waktu',
      name: 'pengaturan-slot-waktu',
      component: () => import('@/views/schedules/PengaturanSlotWaktuView.vue'),
      beforeEnter: adminStaffOnly,
    },
    {
      path: '/penyusunan-jadwal',
      name: 'penyusunan-jadwal',
      component: () => import('@/views/schedules/PenyusunanJadwalView.vue'),
      beforeEnter: adminStaffOnly,
    },
    {
      path: '/slot-waktu',
      name: 'MasterSlotWaktu',
      component: () => import('@/views/schedules/MasterSlotWaktuView.vue'),
    },
    {
      path: "/leaves/history",
      name: "leaves-history",
      component: LeavesHistoryView,
    },
    {
      path: "/leaves/request",
      name: "leave-request",
      component: () => import("@/views/leaves/LeaveRequestFormView.vue"),
      beforeEnter: teacherOnly,
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
    {
      path: '/ketersediaan-mengajar',
      name: 'ketersediaan-mengajar',
      component: () => import('@/views/schedules/TeacherAvailabilityView.vue'),
      meta: { requiresTeacher: true }
    },
    {
      path: '/ketersediaan-mengajar/ringkasan',
      name: 'ketersediaan-ringkasan',
      component: () => import('@/views/schedules/TeacherAvailabilitySummaryView.vue'),
      meta: { requiresTeacher: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/notifications/ListNotificationView.vue'),
    },
  ],
}
)

export default router
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.name === 'login' && token) {
    next({ name: 'landing' })
  } else {
    next()
  }
})