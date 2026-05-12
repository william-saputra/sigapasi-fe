export interface ReviewChartDataset {
  label: string
  data: number[]
}

export interface ReviewChartData {
  labels: string[]
  datasets: ReviewChartDataset[]
}

export interface ReviewPeriodOption {
  id: string
  semesterName: string
}

export interface ReviewAspect {
  name: string
  selfScore: number
  peerScore: number
  superiorScore: number
  tag: 'BLIND_SPOT' | 'GOOD_PERFORMANCE' | 'CONSISTENT_STRENGTH' | null
}

export interface ReviewFeedback {
  date: string | null
  maskedName: string
  role: string
  avgScore: number | null
  comment: string | null
}

export interface ReviewDetailData {
  aspects: ReviewAspect[]
  feedbacks: ReviewFeedback[]
}
