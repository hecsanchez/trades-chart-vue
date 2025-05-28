<template>
  <div class="chart-container">
    <template v-if="shouldRenderChart">
      <div class="chart-header">
        <h2>Real vs Simulated PnL</h2>
      </div>

      <Chart
        v-if="shouldRenderChart"
        :options="chartOptions"
        :update="['chart.update', 'chart.redraw']"
        class="chart"
      />
    </template>
    <div v-else class="empty-state">
      <p>{{ hasValidData ? 'Loading chart...' : 'No trade data available' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'
import type {
  Options,
  SeriesLineOptions,
  AxisLabelsFormatterContextObject,
  AnnotationDraggableValue,
  Annotation,
  EventCallbackFunction,
} from 'highcharts'

// Register Highcharts modules
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsAnnotations from 'highcharts/modules/annotations'

if (typeof window !== 'undefined') {
  const HighchartsInstance = (window as { Highcharts?: typeof Highcharts }).Highcharts
  if (HighchartsInstance) {
    HighchartsMore(HighchartsInstance)
    HighchartsAnnotations(HighchartsInstance)
  }
}

interface Trade {
  mae_percent: number
  pnl_usd: number
  fees: number
  timestamp: string
}

const props = defineProps<{
  trades: Trade[]
  selectedStoploss: number
}>()

const emit = defineEmits<{
  'update:stoploss': [value: number]
}>()

// Add data validation
const hasValidData = computed(() => {
  return Array.isArray(props.trades) && props.trades.length > 0
})

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

// Update data validation to include mounting state
const shouldRenderChart = computed(() => {
  return isMounted.value && hasValidData.value
})

// Compute cumulative PnL data
const computeCumulativePnL = (trades: Trade[], applyStoploss = false) => {
  let cumulativePnL = 0
  return trades.map((trade) => {
    let pnl = trade.pnl_usd

    if (applyStoploss && trade.mae_percent > props.selectedStoploss) {
      const pnlWithoutFees = trade.pnl_usd - trade.fees
      console.log('pnlWithoutFees', pnlWithoutFees)
      pnl = Math.abs(pnlWithoutFees) * (props.selectedStoploss / trade.mae_percent) + trade.fees
    }

    cumulativePnL += pnl
    return {
      x: new Date(trade.timestamp).getTime(),
      y: cumulativePnL,
    }
  })
}

// Chart data
const realPnLData = computed(() => computeCumulativePnL(props.trades))
const simulatedPnLData = computed(() => computeCumulativePnL(props.trades, true))
console.log('realPnLData', realPnLData.value)
console.log('simulatedPnLData', simulatedPnLData.value)
// Chart options
const chartOptions = computed<Options>(() => ({
  chart: {
    type: 'line',
    height: 500,
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#fff',
    },
    backgroundColor: '#262627',
  },
  title: {
    text: '',
  },
  credits: {
    enabled: false,
  },
  xAxis: {
    type: 'datetime',
    title: {
      text: 'Date',
      style: {
        fontSize: '14px',
        fontWeight: '500',
      },
    },
    gridLineWidth: 1,
    gridLineColor: 'rgba(255,255,255,0.08)',
    gridLineDashStyle: 'Dot',
    labels: {
      formatter: function (this: AxisLabelsFormatterContextObject): string {
        return Highcharts.dateFormat('%b %Y', Number(this.value))
      },
      style: { color: '#676768' },
    },
  },
  yAxis: {
    title: {
      text: 'Cumulative PnL ($)',
      style: {
        fontSize: '14px',
        fontWeight: '500',
      },
    },
    gridLineWidth: 1,
    gridLineColor: 'rgba(255,255,255,0.08)',
    gridLineDashStyle: 'Dot',
    labels: {
      formatter: function (this: AxisLabelsFormatterContextObject): string {
        return '$' + Number(this.value).toLocaleString()
      },
      style: { color: '#676768' },
    },
  },
  plotOptions: {
    line: {
      marker: {
        enabled: false,
      },
      states: {
        hover: {
          lineWidth: 2,
        },
      },
    },
  },
  tooltip: {
    shared: true,
    formatter: function (this: unknown): string {
      const ctx = this as { points?: Array<{ series: { name: string }; y: number; x: number }> }
      if (!Array.isArray(ctx.points) || !ctx.points.length) return ''
      const date = Highcharts.dateFormat('%B %Y', Number(ctx.points[0].x))
      const lines = ctx.points.map(
        (point) => '<b>' + point.series.name + ':</b> $' + point.y.toLocaleString(),
      )
      return ['<b>' + date + '</b>', ...lines].join('<br>')
    },
  },
  series: [
    {
      type: 'line',
      name: 'Real PnL',
      data: realPnLData.value,
      color: '#65C49D',
      lineWidth: 2,
      labels: {},
    } as SeriesLineOptions,
    {
      type: 'line',
      name: 'Simulated PnL',
      data: simulatedPnLData.value,
      color: '#DE576F',
      lineWidth: 2,
    } as SeriesLineOptions,
  ],
  legend: {
    itemStyle: { color: '#fff' },
  },
  annotations: [
    {
      draggable: 'x' as AnnotationDraggableValue,
      dragX: true,
      dragY: false,
      shapes: [
        // Vertical line
        {
          type: 'path',
          points: [
            { x: props.selectedStoploss, y: 0, xAxis: 0, yAxis: 0 },
            { x: props.selectedStoploss, y: 100, xAxis: 0, yAxis: 0 },
          ],
          stroke: '#6366F1',
          strokeWidth: 2,
          fill: 'none',
          zIndex: 3,
        },
        // Handle at the bottom (circle)
        {
          type: 'circle',
          point: { x: props.selectedStoploss, y: 0, xAxis: 0, yAxis: 0 },
          r: 10,
          fill: '#fff',
          stroke: '#6366F1',
          strokeWidth: 3,
          zIndex: 4,
        },
      ],
      labels: [
        {
          point: { x: props.selectedStoploss, y: 0, xAxis: 0, yAxis: 0 },
          text: `${props.selectedStoploss.toFixed(2)}%`,
          backgroundColor: '#6366F1',
          borderRadius: 4,
          style: {
            color: '#fff',
            fontWeight: 'bold',
          },
          y: 30, // position below the handle
          zIndex: 5,
        },
      ],
      events: {
        drag: function (this: Annotation, e: { x: number; newX?: number }) {
          const newX = e.x ?? e.newX
          if (typeof newX === 'number') {
            emit('update:stoploss', newX)
          }
        } as EventCallbackFunction<Annotation>,
      },
    },
  ],
}))

// Watch for changes in trades or selectedStoploss to update chart
watch(
  [() => props.trades, () => props.selectedStoploss],
  () => {
    if (chartOptions.value.series && chartOptions.value.series.length >= 2) {
      ;(chartOptions.value.series[0] as SeriesLineOptions).data = realPnLData.value
      ;(chartOptions.value.series[1] as SeriesLineOptions).data = simulatedPnLData.value
    }
  },
  { deep: true },
)
</script>

<style scoped>
.chart-container {
  background: #262627;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.legend-color {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
}

.chart {
  width: 100%;
  height: 500px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  color: #6b7280;
  font-size: 1rem;
  width: 100%;
}
</style>
