<template>
  <div class="stoploss-optimizer">
    <ErrorBanner v-if="error" :message="error" />

    <LoadingOverlay v-else-if="loading" />

    <template v-else>
      <div class="charts-container">
        <div class="chart-row">
          <div v-if="trades.length > 0" class="chart-wrapper">
            <MaePnlScatterChart
              :trades="trades"
              :selected-stoploss="selectedStoploss"
              :pnl-mode="pnlMode"
              :current-expected-value="currentExpectedValue"
              @update:stoploss="selectedStoploss = $event"
              @update:pnlMode="pnlMode = $event"
            />
          </div>
        </div>

        <div class="chart-row">
          <div v-if="trades.length > 0" class="chart-wrapper">
            <PnlCurveChart :trades="trades" :selected-stoploss="selectedStoploss" />
          </div>
        </div>

        <div class="chart-row">
          <div v-if="Object.keys(evByMae).length > 0" class="chart-wrapper">
            <EvWinrateChart :ev-by-mae="evByMae" :selected-stoploss="selectedStoploss" />
          </div>
        </div>
      </div>

      <div class="controls">
        <PnlToggle v-model="pnlMode" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStoplossOptimizerUrl } from '@/constants/api'
import ErrorBanner from '@/components/ErrorBanner.vue'
import MaePnlScatterChart from '@/components/MaePnlScatterChart.vue'
import PnlCurveChart from '@/components/PnlCurveChart.vue'
import EvWinrateChart from '@/components/EvWinrateChart.vue'
import PnlToggle from '@/components/PnlToggle.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

interface Trade {
  mae_percent: number
  pnl_usd: number
  fees: number
  timestamp: string
}

interface EvByMae {
  [key: number]: {
    ev: number
    winrate: number
  }
}

interface ApiResponse {
  valid: boolean
  message?: string
  data?: {
    trades: Trade[]
    ev_by_mae: number[]
    mae_levels: number[]
    optimal_stop: {
      affected_trades_pct: number
      current_ev: number
      ev_improvement_pct: number
      improved_ev: number
      optimal_stoploss: number | null
    }
    recovery_rate_by_mae: number[]
  }
}

const loading = ref(true)
const error = ref<string | null>(null)
const trades = ref<Trade[]>([])
const evByMae = ref<EvByMae>({})
const optimalStoploss = ref(0)
const selectedStoploss = ref(0)
const pnlMode = ref<'$' | '%'>('$')
const currentExpectedValue = ref(0)

// Methods
const fetchData = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await fetch(getStoplossOptimizerUrl())
    let text = await response.text()
    text = text.replace(/\bNaN\b/g, 'null')
    const data: ApiResponse = JSON.parse(text)
    console.log('data', data)
    if (!data.valid) {
      throw new Error(data.message || 'Failed to fetch data')
    }

    if (!data.data) {
      throw new Error('No data received')
    }

    // Ensure data is properly initialized before updating refs
    if (Array.isArray(data.data.trades)) {
      trades.value = data.data.trades
    } else {
      throw new Error('Invalid trades data format')
    }

    // Convert ev_by_mae and mae_levels arrays into the expected format
    if (data.data && Array.isArray(data.data.ev_by_mae) && Array.isArray(data.data.mae_levels)) {
      const evByMaeObj: EvByMae = {}
      data.data.mae_levels.forEach((mae, index) => {
        if (data.data && data.data.ev_by_mae[index] !== null) {
          evByMaeObj[mae] = {
            ev: data.data.ev_by_mae[index],
            winrate: data.data.recovery_rate_by_mae[index],
          }
        }
      })
      evByMae.value = evByMaeObj
    } else {
      throw new Error('Invalid ev_by_mae or mae_levels data format')
    }

    // Handle optimal stoploss
    const optimalStoplossValue = data.data.optimal_stop?.optimal_stoploss
    if (optimalStoplossValue !== null && !isNaN(optimalStoplossValue)) {
      optimalStoploss.value = optimalStoplossValue
      selectedStoploss.value = optimalStoplossValue
    } else {
      // If no optimal stoploss is provided, use the MAE level with highest EV
      const maxEvEntry = Object.entries(evByMae.value).reduce(
        (max, [mae, data]) => {
          return data.ev > max.ev ? { mae: Number(mae), ev: data.ev } : max
        },
        { mae: 0, ev: -Infinity },
      )

      optimalStoploss.value = maxEvEntry.mae
      selectedStoploss.value = maxEvEntry.mae
    }

    // Set currentExpectedValue from API response
    currentExpectedValue.value = data.data.optimal_stop?.current_ev ?? 0
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.stoploss-optimizer {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.chart-row:not(:first-child) {
  grid-template-columns: 1fr;
}

.controls {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
}

.chart-wrapper {
  min-height: 400px;
  width: 100%;
  position: relative;
}

.info-wrapper {
  width: 100%;
  position: relative;
}
</style>
