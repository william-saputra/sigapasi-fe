<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import AppLayout from "@/components/common/AppLayout.vue";
import PageHeader from "@/components/header/PageHeader.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppCard from "@/components/common/AppCard.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import DataTable from "@/components/table/DataTable.vue";

import { useLeaveStore } from "@/stores/leaves/leaverequest.store";
import type { LeaveRequestResponseDTO } from "@/interfaces/leaves/leaverequest.interface";

const router = useRouter();
const leaveStore = useLeaveStore();

onMounted(() => {
  leaveStore.fetchAllLeaves();
});

const columns = [
  { key: "createdAt", label: "TGL DIAJUKAN", thStyle: "width: 16%;" },
  { key: "detail", label: "DETAIL IZIN", thStyle: "width: 20%;" },
  { key: "period", label: "WAKTU PELAKSANAAN", thStyle: "width: 24%;" },
  { key: "status", label: "STATUS", thStyle: "width: 14%;" },
  { key: "note", label: "APPROVAL / REJECTION NOTE", thStyle: "width: 26%;" },
];

function onNewLeave() {
  router.push({ name: "leave-request" });
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    SAKIT: "Sakit",
    IZIN_PRIBADI: "Izin Pribadi",
    DINAS_LUAR: "Dinas Luar",
    MELAHIRKAN: "Melahirkan",
  };
  return map[category] || category;
}

function formatType(type: string): string {
  const map: Record<string, string> = {
    FULL_DAY: "Cuti Harian",
    PARTIAL: "Parsial (Jam Tertentu)",
  };
  return map[type] || type;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[status] || status;
}

function getStatusVariant(status: string): "pending" | "success" | "danger" {
  const map: Record<string, "pending" | "success" | "danger"> = {
    PENDING: "pending",
    APPROVED: "success",
    REJECTED: "danger",
  };
  return map[status] || "pending";
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCreatedDate(createdAt: string): string {
  if (!createdAt) return "-";
  const createdDate = new Date(createdAt);
  const today = new Date();

  const isSameDay =
    createdDate.getDate() === today.getDate() &&
    createdDate.getMonth() === today.getMonth() &&
    createdDate.getFullYear() === today.getFullYear();

  if (isSameDay) return "Hari ini";
  return formatDate(createdAt);
}

function formatCreatedTime(createdAt: string): string {
  if (!createdAt) return "-";
  return (
    new Date(createdAt).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " WIB"
  );
}

function formatTimeOnly(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5); // Mengambil HH:mm dari format HH:mm:ss
}

function calculateDayCount(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
}

function getPeriodDisplay(row: LeaveRequestResponseDTO): { label: string; meta: string } {
  const startLabel = formatDate(row.startDate);
  const endLabel = formatDate(row.endDate);

  if (row.type === "PARTIAL") {
    return {
      label: startLabel,
      meta: `${formatTimeOnly(row.startTime)} - ${formatTimeOnly(row.endTime)} WIB`,
    };
  }

  const days = calculateDayCount(row.startDate, row.endDate);

  return {
    label: row.startDate === row.endDate ? startLabel : `${startLabel} - ${endLabel}`,
    meta: `${days} Hari Kerja`,
  };
}

function getNoteMode(status: string): "waiting" | "rejected" | "normal" {
  if (status === "PENDING") return "waiting";
  if (status === "REJECTED") return "rejected";
  return "normal";
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Riwayat Pengajuan Cuti"
      subtitle="Pantau status perizinan dan cuti Anda di sini."
    >
      <template #actions>
        <AppButton @click="onNewLeave">➕ Ajukan Cuti Baru</AppButton>
      </template>
    </PageHeader>

    <AppCard>
      <div v-if="leaveStore.isLoading" style="text-align: center; padding: 20px;">
        Memuat data...
      </div>

      <div v-else-if="leaveStore.error" style="color: red; text-align: center; padding: 20px;">
        {{ leaveStore.error }}
      </div>

      <DataTable v-else :columns="columns" :rows="leaveStore.sortedLeaves">
        <template #cell:createdAt="{ row }">
          <div style="font-weight: 600">{{ formatCreatedDate(row.createdAt) }}</div>
          <div class="meta-text">{{ formatCreatedTime(row.createdAt) }}</div>
        </template>

        <template #cell:detail="{ row }">
          <div style="font-weight: 600">{{ formatCategory(row.category) }}</div>
          <div class="meta-text">{{ formatType(row.type) }}</div>
        </template>

        <template #cell:period="{ row }">
          <div style="font-weight: 500">{{ getPeriodDisplay(row).label }}</div>
          <div class="meta-text">{{ getPeriodDisplay(row).meta }}</div>
        </template>

        <template #cell:status="{ row }">
          <AppBadge :variant="getStatusVariant(row.status)">
            {{ formatStatus(row.status) }}
          </AppBadge>
        </template>

        <template #cell:note="{ row }">
          <div
            v-if="getNoteMode(row.status) === 'waiting'"
            style="color: var(--text-grey); font-style: italic; font-size: 13px"
          >
            Menunggu persetujuan...
          </div>

          <template v-else-if="getNoteMode(row.status) === 'rejected'">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px">
              Ditolak oleh Kepsek:
            </div>
            <div class="note-box danger">
              "{{ row.rejectionReason }}"
            </div>
          </template>

          <template v-else>
            <div class="note-box">
              {{ row.reason }}
            </div>
          </template>
        </template>
      </DataTable>
    </AppCard>
  </AppLayout>
</template>
