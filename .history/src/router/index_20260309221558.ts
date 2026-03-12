import { createRouter, createWebHistory } from 'vue-router'
import LeavesHistoryView from '../views/leaves/LeavesHistoryView.vue'
>>>>>>>>> Temporary merge branch 2

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
<<<<<<<<< Temporary merge branch 1
      path: "/leaves/history",
      name: "leaves-history",
      component: LeavesHistoryView,
    },
    {
      path: "/leaves/request",
      name: "leave-request",
      component: () => import("@/views/leaves/LeaveRequestView.vue"),
    },
  ],
});
=========
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
    },
    {
      path: '/reviews/periods',
      name: 'reviews-periods',
      component: () => import('@/views/reviews/ReviewManagementView.vue'),
    },
  ],
})
>>>>>>>>> Temporary merge branch 2

export default router;
