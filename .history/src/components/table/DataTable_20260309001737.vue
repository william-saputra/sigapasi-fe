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
              @click="toggle(row.id ?? row.teacherId)"
            >
              ▾
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

<script setup>
import { ref } from 'vue'

const props = defineProps({
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
  width: 40px;
}

.expand-td {
  width: 40px;
  text-align: center;
  padding: 0 8px;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  transition:
    transform 0.2s,
    color 0.15s;
  line-height: 1;
}

.expand-btn:hover {
  color: #1a5c38;
}

.expand-btn--open {
  transform: rotate(180deg);
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
