<template>
  <div class="chart-main-layout">
    <div class="chart-container">
      <template v-if="shouldRenderChart">
        <div class="chart-header">
          <div class="chart-title">
            <h2>MAE vs PnL</h2>
          </div>
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
    <div class="chart-sidebar">
      <div class="sidebar-explanation">
        With this chart you can test out what stoploss would be ideal in order to minimize losses
        and maximize wins.
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Current Expected Value per trade:</div>
        <div :class="['sidebar-value', currentExpectedValue >= 0 ? 'positive' : 'negative']">
          {{ currentExpectedValue >= 0 ? '+' : '' }}${{ currentExpectedValue?.toFixed(2) }}
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Expected Value after implementing new stoploss:</div>
        <div :class="['sidebar-value', afterStoplossEV >= 0 ? 'positive' : 'negative']">
          {{ afterStoplossEV >= 0 ? '+' : '' }}${{ afterStoplossEV?.toFixed(2) }}
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Stoploss distance:</div>
        <div class="sidebar-value">{{ effectiveStoploss.toFixed(2) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import { Chart } from 'highcharts-vue'
import type Highcharts from 'highcharts'
import type {
  SeriesStatesHoverOptionsObject,
  SeriesBubbleOptions,
  PointClickEventObject,
  AxisLabelsFormatterContextObject,
  SeriesClickCallbackFunction,
  Point,
  SeriesLineOptions,
  SeriesScatterOptions,
  OptionsChartZoomingTypeValue,
  PointOptionsObject,
  TooltipFormatterContextObject,
} from 'highcharts'

// Register Highcharts modules
import HighchartsMore from 'highcharts/highcharts-more'
import DraggablePoints from 'highcharts/modules/draggable-points'

// Initialize Highcharts modules
if (typeof window !== 'undefined') {
  const HighchartsInstance = (window as { Highcharts?: typeof Highcharts }).Highcharts
  if (HighchartsInstance) {
    HighchartsMore(HighchartsInstance)
    DraggablePoints(HighchartsInstance)
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
  pnlMode: '$' | '%'
  optimalStoploss?: number
  currentExpectedValue: number
}>()

const emit = defineEmits<{
  'update:stoploss': [value: number]
  'update:pnlMode': [value: '$' | '%']
}>()

// Add data validation
const hasValidData = computed(() => {
  return Array.isArray(props.trades) && props.trades.length > 0
})

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
  // Add a small delay to ensure the chart is fully initialized
  setTimeout(() => {
    const chartElement = document.querySelector('.chart') as HTMLElement & { chart?: ExtendedChart }
    if (chartElement?.chart) {
      console.log('Chart initialized with series:', chartElement.chart.series)
      // Check if dragDrop is enabled
      const handleSeries = chartElement.chart.series[2] as Highcharts.Series & {
        options: ExtendedSeriesOptions
      }
      if (handleSeries) {
        console.log('Handle series dragDrop:', handleSeries.options.dragDrop)
      }
    }
  }, 100)
})

// Update data validation to include mounting state
const shouldRenderChart = computed(() => {
  return isMounted.value && hasValidData.value
})

// Update chart data to handle PnL mode
const chartData = computed(() => {
  const maxFees = Math.max(...props.trades.map((t) => t.fees))
  const totalPnL = props.trades.reduce((sum, t) => sum + t.pnl_usd, 0)

  return props.trades.map((trade) => ({
    x: Math.abs(trade.mae_percent),
    y: props.pnlMode === '$' ? Math.abs(trade.pnl_usd) : Math.abs((trade.pnl_usd / totalPnL) * 100),
    z: (trade.fees / maxFees) * 25,
    color: trade.pnl_usd >= 0 ? '#10B981' : '#EF4444',
    trade,
  }))
})

// Find the minimum y value for the handle
const minY = Math.min(...chartData.value.map((point) => point.y), 0)

// Update y-axis title based on PnL mode
const yAxisTitle = computed(() => (props.pnlMode === '$' ? 'Absolute PnL ($)' : 'Absolute PnL (%)'))

// Update y-axis formatter based on PnL mode
const yAxisFormatter = computed(() =>
  props.pnlMode === '$'
    ? function (this: AxisLabelsFormatterContextObject): string {
        const val = Number(this.value)
        return isFinite(val) ? '$' + val.toLocaleString() : ''
      }
    : function (this: AxisLabelsFormatterContextObject): string {
        const val = Number(this.value)
        return isFinite(val) ? val.toFixed(2) + '%' : ''
      },
)

// Add computed property for optimal stoploss calculation
const calculatedOptimalStoploss = computed(() => {
  if (!props.trades.length) return null

  // Create bins for different stoploss levels (0.1% increments)
  const stoplossLevels = Array.from({ length: 1000 }, (_, i) => i * 0.1)
  const evByStoploss = new Map<number, number>()

  stoplossLevels.forEach((stoploss) => {
    // For each stoploss level, calculate:
    // 1. Trades that would be stopped out (MAE >= stoploss)
    // 2. Trades that would be winners (MAE < stoploss)
    const stoppedTrades = props.trades.filter((t) => Math.abs(t.mae_percent) >= stoploss)
    const winningTrades = props.trades.filter((t) => Math.abs(t.mae_percent) < stoploss)

    // Calculate probabilities and average amounts
    const totalTrades = props.trades.length
    const probStopped = stoppedTrades.length / totalTrades
    const probWin = winningTrades.length / totalTrades

    // Calculate average PnL for stopped trades (these are losses)
    const avgLoss =
      stoppedTrades.length > 0
        ? stoppedTrades.reduce((sum, t) => sum + t.pnl_usd, 0) / stoppedTrades.length
        : 0

    // Calculate average PnL for winning trades
    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl_usd, 0) / winningTrades.length
        : 0

    // Calculate expected value
    const ev = probWin * avgWin - probStopped * Math.abs(avgLoss)
    evByStoploss.set(stoploss, ev)
  })

  // Find the stoploss level with maximum EV
  let maxEV = -Infinity
  let optimalStoploss = 0

  evByStoploss.forEach((ev, stoploss) => {
    if (ev > maxEV) {
      maxEV = ev
      optimalStoploss = stoploss
    }
  })
  console.log('optimalStoploss', optimalStoploss)
  return optimalStoploss
})

// Add a computed property for the effective stoploss (use calculated if none provided)
const effectiveStoploss = computed(() => {
  return props.selectedStoploss || calculatedOptimalStoploss.value || 0
})

// Update the ExtendedChart interface
interface ExtendedChart {
  redraw: (animation?: boolean) => void
  series: Highcharts.Series[]
}

interface ExtendedPoint extends Point {
  dataLabel?: {
    attr: (options: { text: string }) => void
  }
}

// Add type declaration for dragDrop
interface DragDropOptions {
  draggableX?: boolean
  draggableY?: boolean
  dragMinX?: number
  dragMaxX?: number
  dragPrecisionX?: number
  liveRedraw?: boolean
  dragSensitivity?: number
}

interface ExtendedSeriesOptions extends SeriesScatterOptions {
  dragDrop?: DragDropOptions
}

// Split trades into winning and losing for separate series
const winningTradesData = computed(() => {
  const maxFees = Math.max(...props.trades.map((t) => t.fees))
  const totalPnL = props.trades.reduce((sum, t) => sum + t.pnl_usd, 0)
  return props.trades
    .filter((trade) => trade.pnl_usd >= 0)
    .map((trade) => ({
      x: Math.abs(trade.mae_percent),
      y:
        props.pnlMode === '$'
          ? Math.abs(trade.pnl_usd)
          : Math.abs((trade.pnl_usd / totalPnL) * 100),
      z: (trade.fees / maxFees) * 25,
      trade,
    }))
})
const losingTradesData = computed(() => {
  const maxFees = Math.max(...props.trades.map((t) => t.fees))
  const totalPnL = props.trades.reduce((sum, t) => sum + t.pnl_usd, 0)
  return props.trades
    .filter((trade) => trade.pnl_usd < 0)
    .map((trade) => ({
      x: Math.abs(trade.mae_percent),
      y:
        props.pnlMode === '$'
          ? Math.abs(trade.pnl_usd)
          : Math.abs((trade.pnl_usd / totalPnL) * 100),
      z: (trade.fees / maxFees) * 25,
      trade,
    }))
})

// Chart options
const chartOptions = computed(() => ({
  chart: {
    type: 'bubble',
    height: 500,
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#fff',
      backgroundColor: '#262627',
    },
    zooming: {
      type: 'none' as OptionsChartZoomingTypeValue,
    },
    animation: false,
    backgroundColor: '#262627',
  },
  title: {
    text: '',
    style: { color: '#fff' },
  },
  credits: {
    enabled: false,
  },
  xAxis: {
    title: {
      text: 'Absolute Maximum Adverse Excursion (%)',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#aaa',
      },
    },
    gridLineWidth: 1,
    gridLineColor: 'rgba(255,255,255,0.08)',
    gridLineDashStyle: 'Dot',
    tickAmount: 10,
    labels: {
      formatter: function (this: AxisLabelsFormatterContextObject): string {
        const val = Number(this.value)
        return isFinite(val) ? val.toFixed(2) + '%' : ''
      },
      style: { color: '#676768' },
    },
    accessibility: {
      description: 'Stoploss percentage',
    },
  },
  yAxis: {
    title: {
      text: yAxisTitle.value,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#aaa',
      },
    },
    gridLineWidth: 1,
    gridLineColor: 'rgba(255,255,255,0.08)',
    gridLineDashStyle: 'Dot',
    labels: {
      formatter: yAxisFormatter.value,
      style: { color: '#676768' },
    },
    accessibility: {
      description: 'Profit and Loss',
    },
  },
  plotOptions: {
    bubble: {
      minSize: '0.1%',
      maxSize: '2%',
      zMin: 0,
      zMax: 25,
      marker: {
        symbol: 'circle',
      },
      states: {
        hover: {
          enabled: true,
          brightness: 0.1,
        } as SeriesStatesHoverOptionsObject,
      },
    },
    series: {
      enableMouseTracking: true,
      stickyTracking: false,
    },
  },
  tooltip: {
    useHTML: true,
    headerFormat: '<table>',
    pointFormat:
      '<tr><th colspan="2"><h3>Trade Details</h3></th></tr>' +
      '<tr><th>MAE:</th><td>{point.x:.2f}%</td></tr>' +
      '<tr><th>PnL:</th><td>' +
      (props.pnlMode === '$' ? '${point.y:,.0f}' : '{point.y:.2f}%') +
      '</td></tr>' +
      '<tr><th>Fees:</th><td>${point.trade.fees:.2f}</td></tr>' +
      '<tr><th>Date:</th><td>{point.trade.timestamp}</td></tr>',
    footerFormat: '</table>',
    followPointer: true,
    backgroundColor: '#23262F',
    style: { color: '#fff' },
    formatter: function (this: { point: Point & { trade?: Trade } }) {
      const point = this.point
      const mae = typeof point.x === 'number' ? point.x.toFixed(2) : '0.00'
      const pnl =
        typeof point.y === 'number'
          ? props.pnlMode === '$'
            ? '$' + point.y.toLocaleString(undefined, { maximumFractionDigits: 0 })
            : point.y.toFixed(2) + '%'
          : '0.00'
      const fees = point.trade?.fees ? point.trade.fees.toFixed(2) : '0.00'
      const date = point.trade?.timestamp || ''

      return `
        <table>
          <tr><th colspan="2"><h3>Trade Details</h3></th></tr>
          <tr><th>MAE:</th><td>${mae}%</td></tr>
          <tr><th>PnL:</th><td>${pnl}</td></tr>
          <tr><th>Fees:</th><td>$${fees}</td></tr>
          <tr><th>Date:</th><td>${date}</td></tr>
        </table>
      `
    },
  },
  legend: {
    itemStyle: { color: '#fff' },
  },
  series: [
    {
      type: 'bubble',
      name: 'Winning trades',
      data: winningTradesData.value,
      color: '#7ec6a2',
      marker: { symbol: 'circle' },
    },
    {
      type: 'bubble',
      name: 'Losing trades',
      data: losingTradesData.value,
      color: '#d1787c',
      marker: { symbol: 'circle' },
    },
    {
      type: 'line' as const,
      name: 'Stoploss Line',
      data: [
        [effectiveStoploss.value, 0],
        [effectiveStoploss.value, 100],
      ],
      color: '#6366F1',
      lineWidth: 5,
      zIndex: 3,
      enableMouseTracking: false,
      marker: {
        enabled: false,
      },
      showInLegend: false,
    } as SeriesLineOptions,
    {
      type: 'scatter' as const,
      showInLegend: false,
      name: 'Stoploss Handle',
      data: [[effectiveStoploss.value, minY]],
      color: '#fff',
      marker: {
        symbol: 'circle',
        radius: 8,
        lineColor: '#6366F1',
        lineWidth: 2,
        states: {
          hover: {
            enabled: true,
            brightness: 0.1,
          },
        },
      },
      zIndex: 4,
      dragDrop: {
        draggableX: true,
        draggableY: false,
        dragMinX: 0,
        dragMaxX: 100,
        dragPrecisionX: 0.01,
        liveRedraw: true,
        dragSensitivity: 2,
      },
      stickyTracking: false,
      enableMouseTracking: true,
      point: {
        events: {
          dragStart: function (this: Highcharts.Series, e: { point: Point }) {
            console.log('Drag start', e)
          },
          drag: function (this: Highcharts.Series, e: { newPoints: Point[] }) {
            console.log('Drag', e.newPoints)
          },
          drop: function (this: Highcharts.Series, e: { newPoints: Point[] }) {
            console.log('Drag end', Object.values(e.newPoints)[0].newValues.x)
            emit('update:stoploss', Object.values(e.newPoints)[0].newValues.x)
          },
        },
      },
      events: {
        click: function (this: Highcharts.Series, e: Highcharts.SeriesClickEventObject) {
          console.log('Handle clicked', e.point.x)
        } as SeriesClickCallbackFunction,
        afterAnimate: function (this: Highcharts.Series, e: { point: Point }) {
          console.log('After animate', e.point)
        },
        drag: function (this: Highcharts.Series, e: { point: Point; newX?: number }) {
          console.log('Dragging at:', e.newX?.toFixed(2) + '%')
          if (typeof e.newX === 'number') {
            // Round to 2 decimal places
            const roundedX = Math.round(e.newX * 100) / 100

            // Update the line series
            const lineSeries = this.chart.series[1]
            if (lineSeries) {
              lineSeries.setData([
                [roundedX, 0],
                [roundedX, 100],
              ])
            }

            // Update the label
            const labelSeries = this.chart.series[2]
            if (labelSeries && labelSeries.points[0]) {
              const point = labelSeries.points[0] as ExtendedPoint
              const newPoint: PointOptionsObject = {
                x: roundedX,
                y: 0,
              }
              point.update(newPoint, false)
              if (point.dataLabel) {
                point.dataLabel.attr({
                  text: `${roundedX.toFixed(2)}%`,
                })
              }
            }

            // Emit the new stoploss value
            emit('update:stoploss', roundedX)
          }
        },
        dragEnd: function (this: Highcharts.Series, e: { point: Point }) {
          console.log('Drag ended at:', e.point.x.toFixed(2) + '%')
        },
      },
    } as unknown as SeriesScatterOptions,
    {
      type: 'scatter' as const,
      name: 'Stoploss Label',
      data: [[effectiveStoploss.value, 0]],
      color: 'transparent',
      marker: {
        enabled: false,
      },
      showInLegend: false,
      dataLabels: {
        enabled: true,
        format: `${effectiveStoploss.value.toFixed(2)}%`,
        style: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        backgroundColor: '#6366F1',
        borderRadius: 4,
        padding: 4,
        y: 30,
        useHTML: true,
        formatter: function (this: Point) {
          return `<div style="
            background-color: #6366F1;
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            white-space: nowrap;
          ">${this.y?.toFixed(2)}%</div>`
        },
      },
      zIndex: 5,
      enableMouseTracking: false,
    } as SeriesScatterOptions,
    {
      type: 'line' as const,
      name: 'Optimal Stoploss',
      showInLegend: false,
      data: calculatedOptimalStoploss.value
        ? [
            [calculatedOptimalStoploss.value, 0],
            [calculatedOptimalStoploss.value, 100],
          ]
        : [],
      color: '#10B981',
      lineWidth: 2,
      dashStyle: 'Dash',
      zIndex: 2,
      enableMouseTracking: false,
      marker: {
        enabled: false,
      },
    } as SeriesLineOptions,
  ],
  annotations: [],
}))

// Watch for changes in trades or pnlMode to update chart
watch(
  [() => props.trades, () => props.pnlMode],
  () => {
    if (chartOptions.value.series?.[0]) {
      chartOptions.value.series[0].data = chartData.value
    }
  },
  { deep: true },
)

// Watch for changes in calculated optimal stoploss to update the draggable point
watch(
  calculatedOptimalStoploss,
  (newOptimal) => {
    if (newOptimal && !props.selectedStoploss) {
      emit('update:stoploss', newOptimal)
    }
  },
  { immediate: true },
)

// --- Sidebar EV calculations ---
const afterStoplossEV = computed(() => {
  if (!props.trades.length) return 0
  const stoploss = effectiveStoploss.value
  const stoppedTrades = props.trades.filter((t) => Math.abs(t.mae_percent) >= stoploss)
  const winningTrades = props.trades.filter((t) => Math.abs(t.mae_percent) < stoploss)
  const totalTrades = props.trades.length
  const probStopped = stoppedTrades.length / totalTrades
  const probWin = winningTrades.length / totalTrades
  const avgLoss =
    stoppedTrades.length > 0
      ? stoppedTrades.reduce((sum, t) => sum + t.pnl_usd, 0) / stoppedTrades.length
      : 0
  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl_usd, 0) / winningTrades.length
      : 0
  return probWin * avgWin - probStopped * Math.abs(avgLoss)
})
</script>

<style scoped>
.chart-main-layout {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: flex-start;
}
.chart-container {
  flex: 2 1 0%;
  background: #262627;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
}
.chart-sidebar {
  flex: 1 1 0%;
  background: #262627;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 280px;
  max-width: 340px;
}
.sidebar-explanation {
  font-size: 1rem;
  color: #fff;
  margin-bottom: 1rem;
}
.sidebar-section {
  margin-bottom: 1rem;
}
.sidebar-label {
  font-size: 1rem;
  color: #aaa;
  margin-bottom: 0.25rem;
}
.sidebar-value {
  font-size: 1.25rem;
  font-weight: bold;
}
.sidebar-value.positive {
  color: #10b981;
}
.sidebar-value.negative {
  color: #ef4444;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.chart-title {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.pnl-mode-toggle {
  display: flex;
  gap: 0.5rem;
}

.pnl-mode-toggle button {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  color: #4b5563;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pnl-mode-toggle button:hover {
  background: #f9fafb;
}

.pnl-mode-toggle button.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.375rem;
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

.legend-color.winning {
  background-color: #10b981;
}

.legend-color.losing {
  background-color: #ef4444;
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

/* Update these styles */
:deep(.highcharts-drag-handle) {
  cursor: ew-resize !important;
  pointer-events: all !important;
  touch-action: none;
  will-change: transform;
}

:deep(.highcharts-annotation) {
  pointer-events: all !important;
  user-select: none;
  touch-action: none;
  will-change: transform;
}

:deep(.highcharts-annotation-shapes) {
  pointer-events: all !important;
  user-select: none;
  touch-action: none;
  will-change: transform;
}

:deep(.highcharts-annotation-shape) {
  pointer-events: all !important;
  user-select: none;
  touch-action: none;
  will-change: transform;
}

:deep(.highcharts-annotation-label) {
  pointer-events: none !important;
  user-select: none;
  background: none !important;
  border: none !important;
}

:deep(.highcharts-annotation-label-box) {
  display: none !important;
}

:deep(.highcharts-label-box) {
  display: none !important;
}

:deep(.highcharts-annotation-label path) {
  display: none !important;
}

:deep(.highcharts-annotation-label text) {
  pointer-events: none !important;
}

:deep(.highcharts-annotation-labels) {
  pointer-events: none !important;
  user-select: none;
  touch-action: none;
  will-change: transform;
  background: none !important;
  border: none !important;
}

:deep(.highcharts-annotation-labels path) {
  display: none !important;
}

/* Disable zoom cursor */
:deep(.highcharts-container) {
  cursor: default !important;
}

.custom-legend {
  display: flex;
  gap: 2.5rem;
  margin: 2rem 0 0 0;
  align-items: center;
  justify-content: flex-start;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.legend-square {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-block;
}
.legend-square.winning {
  background: #7ec6a2;
}
.legend-square.losing {
  background: #d1787c;
}
.legend-label {
  color: #88898a;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}
</style>
