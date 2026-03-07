<script setup lang="ts">
import { useRouter } from "vue-router";

import AppLayout from "@/components/common/AppLayout.vue";
import PageHeader from "@/components/header/PageHeader.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppCard from "@/components/common/AppCard.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import DataTable from "@/components/table/DataTable.vue";

const router = useRouter();

type LeaveRequestType = "FULL_DAY" | "PARTIAL";
type LeaveCategory = "SAKIT" | "IZIN_PRIBADI" | "DINAS_LUAR" | "MELAHIRKAN";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

type LeaveRequestRow = {
  id: string;
  type: LeaveRequestType;
  category: LeaveCategory;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  attachment_url: string | null;
  status: LeaveStatus;
  rejection_reason: string | null;
  created_at: string;
};

const columns = [
  { key: "created_at", label: "TGL DIAJUKAN", thStyle: "width: 16%;" },
  { key: "detail", label: "DETAIL IZIN", thStyle: "width: 20%;" },
  { key: "period", label: "WAKTU PELAKSANAAN", thStyle: "width: 24%;" },
  { key: "status", label: "STATUS", thStyle: "width: 14%;" },
  { key: "note", label: "CATATAN / ALASAN", thStyle: "width: 26%;" },
];

const rows: LeaveRequestRow[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    type: "PARTIAL",
    category: "IZIN_PRIBADI",
    start_date: "2026-02-25",
    end_date: "2026-02-25",
    start_time: "08:00:00",
    end_time: "10:00:00",
    reason: "Keperluan pribadi",
    attachment_url: null,
    status: "PENDING",
    rejection_reason: null,
    created_at: "2026-02-25T08:30:00+07:00",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    type: "FULL_DAY",
    category: "IZIN_PRIBADI",
    start_date: "2026-02-20",
    end_date: "2026-02-22",
    start_time: null,
    end_time: null,
    reason: "Keperluan keluarga",
    attachment_url: null,
    status: "REJECTED",
    rejection_reason: "Sisa jatah cuti tidak mencukupi untuk 3 hari.",
    created_at: "2026-02-18T14:10:00+07:00",
  },
];

function onNewLeave() {
  router.push({ name: "leave-request" });
}

function formatCategory(category: LeaveCategory): string {
  const map: Record<LeaveCategory, string> = {
    SAKIT: "Sakit",
    IZIN_PRIBADI: "Izin Pribadi",
    DINAS_LUAR: "Dinas Luar",
    MELAHIRKAN: "Melahirkan",
  };
  return map[category];
}

function formatType(type: LeaveRequestType): string {
  const map: Record<LeaveRequestType, string> = {
    FULL_DAY: "Cuti Harian",
    PARTIAL: "Parsial (Jam Tertentu)",
  };
  return map[type];
}

function formatStatus(status: LeaveStatus): string {
  const map: Record<LeaveStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[status];
}

function getStatusVariant(status: LeaveStatus): "pending" | "success" | "danger" {
  const map: Record<LeaveStatus, "pending" | "success" | "danger"> = {
    PENDING: "pending",
    APPROVED: "success",
    REJECTED: "danger",
  };
  return map[status];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCreatedDate(createdAt: string): string {
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
  return time.slice(0, 5);
}

function calculateDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
}

function getPeriodDisplay(row: LeaveRequestRow): { label: string; meta: string } {
  const startLabel = formatDate(row.start_date);
  const endLabel = formatDate(row.end_date);

  if (row.type === "PARTIAL") {
    return {
      label: startLabel,
      meta: `${formatTimeOnly(row.start_time)} - ${formatTimeOnly(row.end_time)} WIB`,
    };
  }

  const days = calculateDayCount(row.start_date, row.end_date);

  return {
    label: row.start_date === row.end_date ? startLabel : `${startLabel} - ${endLabel}`,
    meta: `${days} Hari Kerja`,
  };
}

function getNoteMode(status: LeaveStatus): "waiting" | "rejected" | "normal" {
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
      <DataTable :columns="columns" :rows="rows">
        <template #cell:created_at="{ row }">
          <div style="font-weight: 600">{{ formatCreatedDate(row.created_at) }}</div>
          <div class="meta-text">{{ formatCreatedTime(row.created_at) }}</div>
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
              "{{ row.rejection_reason }}"
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
