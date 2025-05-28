<template>
  <div class="toggle-container">
    <button
      class="toggle-button"
      :class="{ active: modelValue === '$' }"
      @click="$emit('update:modelValue', '$')"
    >
      $
    </button>
    <button
      class="toggle-button"
      :class="{ active: modelValue === '%' }"
      @click="$emit('update:modelValue', '%')"
    >
      %
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: '$' | '%'
}>()

defineEmits<{
  'update:modelValue': [value: '$' | '%']
}>()
</script>

<style scoped>
.toggle-container {
  display: inline-flex;
  background-color: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.375rem;
  gap: 0.25rem;
}

.toggle-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  color: #111827;
}

.toggle-button.active {
  background-color: white;
  color: #111827;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
</style>
