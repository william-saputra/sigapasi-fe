import { ref, watch } from 'vue'
import apiService from '@/services/api.service'
import { getCurrentUser } from '@/lib/auth'
import type { ReviewChartData, ReviewPeriodOption } from '@/interfaces/reviews/review-chart.interface'

export function useReviewChart() {
  const chartData = ref<ReviewChartData | null>(null)
  const periods = ref<ReviewPeriodOption[]>([])
  const selectedPeriodId = ref<string | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchPeriods() {
    try {
      const raw = await apiService.get<{ id: string; semesterName: string }[]>('/reviews/periods')
      periods.value = raw.map((p) => ({ id: p.id, semesterName: p.semesterName }))
      if (periods.value.length > 0 && !selectedPeriodId.value) {
        selectedPeriodId.value = periods.value[0]!.id
      }
    } catch {
      // periods unavailable — chart stays hidden
    }
  }

  async function fetchChart() {
    const user = getCurrentUser()
    if (!user?.id || !selectedPeriodId.value) return

    isLoading.value = true
    hasError.value = false

    try {
      chartData.value = await apiService.get<ReviewChartData>(
        `/reviews/results/${user.id}?periodId=${selectedPeriodId.value}`,
      )
    } catch {
      hasError.value = true
      chartData.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(selectedPeriodId, (id) => {
    if (id) fetchChart()
  })

  async function init() {
    await fetchPeriods()
    await fetchChart()
  }

  return { chartData, periods, selectedPeriodId, isLoading, hasError, init }
}
