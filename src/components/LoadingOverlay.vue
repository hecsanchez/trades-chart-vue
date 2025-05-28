<template>
  <div class="loading-overlay">
    <div class="spinner"></div>
    <div class="loading-text">Loading...</div>
  </div>
</template>

<script setup lang="ts">
// No props needed for now
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 5px solid #e5e7eb;
  border-top: 5px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-text {
  font-size: 1.1rem;
  color: #6366f1;
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
