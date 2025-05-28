<template>
  <div class="chart-container">
    <template v-if="shouldRenderChart">
      <div class="chart-header">
        <h2>Expected Value & Win Rate</h2>
      </div>

      <Chart
        v-if="shouldRenderChart"
        :options="chartOptions"
        :update="['chart.update', 'chart.redraw']"
        class="chart"
      />
    </template>
    <div v-else class="empty-state">
      <p>{{ hasValidData ? 'Loading chart...' : 'No data available' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'
import type { SeriesLineOptions, PointOptionsObject } from 'highcharts'

// Register Highcharts modules
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsAnnotations from 'highcharts/modules/annotations'

// Initialize Highcharts modules
if (typeof window !== 'undefined') {
  const HighchartsInstance = (window as { Highcharts?: typeof Highcharts }).Highcharts
  if (HighchartsInstance) {
    HighchartsMore(HighchartsInstance)
    HighchartsAnnotations(HighchartsInstance)
  }
}

interface EvByMae {
  [key: number]: {
    ev: number
    winrate: number
  }
}

const props = defineProps<{
  evByMae: EvByMae
  selectedStoploss: number
}>()

// Add data validation
const hasValidData = computed(() => {
  return Object.keys(props.evByMae).length > 0
})

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

// Update data validation to include mounting state
const shouldRenderChart = computed(() => {
  return isMounted.value && hasValidData.value
})

// Compute chart data
const chartData = computed(() => {
  const maeValues = Object.keys(props.evByMae)
    .map(Number)
    .sort((a, b) => a - b)

  return {
    ev: maeValues.map((mae) => ({
      x: mae,
      y: props.evByMae[mae].ev,
    })) as PointOptionsObject[],
    winrate: maeValues.map((mae) => ({
      x: mae,
      y: props.evByMae[mae].winrate * 100, // Convert to percentage
    })) as PointOptionsObject[],
  }
})

// Chart options
const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: 500,
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
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
    title: {
      text: 'Stoploss Distance (MAE %)',
      style: {
        fontSize: '14px',
        fontWeight: '500',
      },
    },
    gridLineWidth: 1,
    gridLineColor: 'rgba(255,255,255,0.08)',
    gridLineDashStyle: 'Dot',
    tickAmount: 5,
    labels: {
      formatter: function (this: { value: number }): string {
        return this.value + '%'
      },
      style: { color: '#676768' },
    },
  },
  yAxis: [
    {
      title: {
        text: 'Expected Value ($)',
        style: {
          fontSize: '14px',
          fontWeight: '500',
        },
      },
      gridLineWidth: 1,
      gridLineColor: 'rgba(255,255,255,0.08)',
      gridLineDashStyle: 'Dot',
      labels: {
        formatter: function (this: { value: number }): string {
          return '$' + this.value.toLocaleString()
        },
        style: { color: '#676768' },
      },
    },
    {
      title: {
        text: 'Win Rate (%)',
        style: {
          fontSize: '14px',
          fontWeight: '500',
        },
      },
      opposite: true,
      gridLineWidth: 0,
      labels: {
        formatter: function (this: { value: number }): string {
          return this.value + '%'
        },
      },
      max: 100,
    },
  ],
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
    formatter: function (this: any): string {
      if (!this.points || !this.points.length) return ''
      const mae = this.points[0].x
      const lines = this.points.map((point: any) => {
        const value =
          point.series.name === 'Win Rate'
            ? point.y.toFixed(1) + '%'
            : '$' + point.y.toLocaleString()
        return '<b>' + point.series.name + ':</b> ' + value
      })
      return ['<b>MAE: ' + mae + '%</b>', ...lines].join('<br>')
    },
  },
  series: [
    {
      type: 'line',
      name: 'Expected Value',
      data: chartData.value.ev,
      color: '#65C49D',
      lineWidth: 2,
      yAxis: 0,
    } as SeriesLineOptions,
    {
      type: 'line',
      name: 'Win Rate',
      data: chartData.value.winrate,
      color: '#DE576F',
      lineWidth: 2,
      yAxis: 1,
      dashStyle: 'ShortDash',
    } as SeriesLineOptions,
  ],
  legend: {
    itemStyle: { color: '#fff' },
  },
  annotations: [
    {
      draggable: 'x' as const,
      dragX: true,
      dragY: false,
      shapes: [
        {
          type: 'path',
          points: [
            {
              x: props.selectedStoploss,
              y: 0,
              xAxis: 0,
              yAxis: 0,
            },
            {
              x: props.selectedStoploss,
              y: 100,
              xAxis: 0,
              yAxis: 0,
            },
          ],
          stroke: '#6366F1',
          strokeWidth: 2,
          fill: 'none',
        },
      ],
    },
  ],
}))

// Watch for changes in evByMae or selectedStoploss to update chart
watch(
  [() => props.evByMae, () => props.selectedStoploss],
  () => {
    if (chartOptions.value.series?.[0] && chartOptions.value.series?.[1]) {
      ;(chartOptions.value.series[0] as SeriesLineOptions).data = chartData.value.ev(
        chartOptions.value.series[1] as SeriesLineOptions,
      ).data = chartData.value.winrate
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

.legend-color.ev {
  background-color: #3b82f6;
}

.legend-color.winrate {
  background-color: #10b981;
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
