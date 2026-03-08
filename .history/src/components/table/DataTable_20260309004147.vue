<template>
  <table>
    <thead>
      <tr>
        <th v-if="expandable" class="expand-th"></th>
        <th v-for="col in columns" :key="col.key" :style="col.thStyle">
          {{ col.label }}
        </th>
      </tr>
    </thead>

    <tbody>
      <template v-for="row in rows" :key="row.id">
        <tr :class="{ 'row--expanded': expandable && isExpanded(row.id ?? row.teacherId) }">
          <td v-if="expandable" class="expand-td">
            <button
              class="expand-btn"
              :class="{ 'expand-btn--open': isExpanded(row.id ?? row.teacherId) }"
              :aria-expanded="isExpanded(row.id ?? row.teacherId)"
              @click="toggle(row.id ?? row.teacherId)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5L7 9L11 5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </td>
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell:${col.key}`" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="expandable && isExpanded(row.id ?? row.teacherId)" class="expand-content-row">
          <td :colspan="columns.length + 1" class="expand-content-td">
            <slot name="expanded" :row="row" />
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  columns: { type: Array, required: true }, // [{key,label,thStyle}]
  rows: { type: Array, required: true },
  expandable: { type: Boolean, default: false },
})

const emit = defineEmits(['expand'])

const expandedIds = ref([])

function toggle(id) {
  const idx = expandedIds.value.indexOf(id)
  if (idx >= 0) {
    expandedIds.value.splice(idx, 1)
  } else {
    expandedIds.value.push(id)
    emit('expand', id)
  }
}

function isExpanded(id) {
  return expandedIds.value.includes(id)
}
</script>

<style scoped>
.expand-th {
  width: 44px;
}

.expand-td {
  width: 44px;
  text-align: center;
  padding: 0 10px;
  vertical-align: middle;
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-btn:hover {
  background: #f0faf4;
  border-color: #d1fae5;
  color: #1a5c38;
}

.expand-btn--open {
  transform: rotate(180deg);
  background: #e6f4eb;
  border-color: #bbf0cc;
  color: #1a5c38;
}

.row--expanded td {
  border-bottom: none;
}

.expand-content-row td {
  padding: 0;
}

.expand-content-td {
  padding: 0 !important;
}
</style>
