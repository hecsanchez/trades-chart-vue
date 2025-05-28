<template>
  <div class="error-banner" role="alert">
    <div class="error-content">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 8V12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 16H12.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<style scoped>
.error-banner {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #dc2626;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}
</style>
