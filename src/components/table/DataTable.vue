<template>
  <table>
    <thead>
    <tr>
      <th v-for="col in columns" :key="col.key" :style="col.thStyle">
        {{ col.label }}
      </th>
    </tr>
    </thead>

    <tbody>
    <tr v-for="row in rows" :key="row.id">
      <td v-for="col in columns" :key="col.key">
        <slot :name="`cell:${col.key}`" :row="row">
          {{ row[col.key] }}
        </slot>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true }, // [{key,label,thStyle}]
  rows: { type: Array, required: true },
});
</script>
