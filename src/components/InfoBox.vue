<template>
  <div class="info-box">
    <div class="info-section">
      <h3>Current Stoploss</h3>
      <div class="info-value">
        <span class="value">{{ selectedStoploss.toFixed(2) }}%</span>
        <span class="label">MAE</span>
      </div>
      <div class="info-stats">
        <div class="stat">
          <span class="stat-label">Expected Value</span>
          <span class="stat-value" :class="{ positive: currentEv > 0, negative: currentEv < 0 }">
            ${{ currentEv.toLocaleString() }}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Win Rate</span>
          <span class="stat-value">{{ currentWinrate.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>Optimal Stoploss</h3>
      <div class="info-value">
        <span class="value">{{ optimalStoploss.toFixed(1) }}%</span>
        <span class="label">MAE</span>
      </div>
      <div class="info-stats">
        <div class="stat">
          <span class="stat-label">Expected Value</span>
          <span class="stat-value" :class="{ positive: optimalEv > 0, negative: optimalEv < 0 }">
            ${{ optimalEv.toLocaleString() }}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Win Rate</span>
          <span class="stat-value">{{ optimalWinrate.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>Improvement</h3>
      <div
        class="improvement"
        :class="{ positive: evImprovement > 0, negative: evImprovement < 0 }"
      >
        <span class="improvement-value">
          {{ evImprovement > 0 ? '+' : '' }}${{ evImprovement.toLocaleString() }}
        </span>
        <span class="improvement-label">Expected Value</span>
      </div>
      <div
        class="improvement"
        :class="{ positive: winrateImprovement > 0, negative: winrateImprovement < 0 }"
      >
        <span class="improvement-value">
          {{ winrateImprovement > 0 ? '+' : '' }}{{ winrateImprovement.toFixed(1) }}%
        </span>
        <span class="improvement-label">Win Rate</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface EvByMae {
  [key: number]: {
    ev: number
    winrate: number
  }
}

const props = defineProps<{
  optimalStoploss: number
  selectedStoploss: number
  evByMae: EvByMae
}>()

// Get current stats
const currentEv = computed(() => props.evByMae[props.selectedStoploss]?.ev ?? 0)
const currentWinrate = computed(() => (props.evByMae[props.selectedStoploss]?.winrate ?? 0) * 100)

// Get optimal stats
const optimalEv = computed(() => props.evByMae[props.optimalStoploss]?.ev ?? 0)
const optimalWinrate = computed(() => (props.evByMae[props.optimalStoploss]?.winrate ?? 0) * 100)

// Compute improvements
const evImprovement = computed(() => optimalEv.value - currentEv.value)
const winrateImprovement = computed(() => optimalWinrate.value - currentWinrate.value)
</script>

<style scoped>
.info-box {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #4b5563;
  margin: 0;
}

.info-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.info-value .value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.info-value .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 500;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.improvement {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: #f9fafb;
}

.improvement.positive {
  background-color: #ecfdf5;
}

.improvement.negative {
  background-color: #fef2f2;
}

.improvement-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.improvement.positive .improvement-value {
  color: #10b981;
}

.improvement.negative .improvement-value {
  color: #ef4444;
}

.improvement-label {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
