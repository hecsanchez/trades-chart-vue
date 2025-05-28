<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
:root {
  --color-background: #1c1c1d;
  --color-text: #2c3e50;
  --color-border: #eaecef;
  --color-primary: #42b883;
  --color-danger: #dc3545;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-info: #17a2b8;
  --color-gray-100: #f8f9fa;
  --color-gray-200: #e9ecef;
  --color-gray-300: #dee2e6;
  --color-gray-400: #ced4da;
  --color-gray-500: #adb5bd;
  --color-gray-600: #6c757d;
  --color-gray-700: #495057;
  --color-gray-800: #343a40;
  --color-gray-900: #212529;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--color-text);
  background: var(--color-background);
  line-height: 1.6;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

@media (min-width: 1024px) {
  #app {
    padding: 0 2rem;
  }
}
</style>
