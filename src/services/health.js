import http from './request'

const toNumber = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const normalizeTodayCheckin = (data = {}) => {
  if (!data) {
    return {
      hasChecked: false,
      checkin: null,
      continuousDays: 0
    }
  }

  const hasChecked = !!data.hasChecked
  const checkin = data.checkin || null
  return {
    hasChecked,
    checkin,
    continuousDays: toNumber(data.continuousDays)
  }
}

const normalizeScore = (data = {}) => {
  const currentScore = toNumber(data.currentScore ?? data.score)
  return {
    currentScore,
    score: currentScore,
    weeklyAvg: toNumber(data.weeklyAvg),
    trend: data.trend || 'NONE'
  }
}

const normalizeStreak = (data = {}) => {
  const days = toNumber(data.continuousDays ?? data.days)
  return {
    days,
    continuousDays: days,
    total: toNumber(data.totalCheckinDays ?? data.total)
  }
}

const normalizeStats = (data = {}) => {
  const trendData = Array.isArray(data.trendData) ? data.trendData : []
  const bestPoint = trendData.reduce((best, item) => {
    if (!best || toNumber(item.moodScore) > toNumber(best.moodScore)) return item
    return best
  }, null)

  return {
    totalCheckins: toNumber(data.totalCheckins ?? data.checkinCount),
    avgMood: toNumber(data.avgMood ?? data.avgMoodScore),
    avgSleep: toNumber(data.avgSleep ?? data.avgSleepHours),
    streakDays: toNumber(data.streakDays),
    bestDay: data.bestDay || bestPoint?.date || '',
    bestMood: toNumber(data.bestMood ?? bestPoint?.moodScore),
    trendData
  }
}

const normalizeHistory = (data = {}) => {
  const records = Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.list)
      ? data.list
      : []

  return {
    ...data,
    records: records.map(item => ({
      ...item,
      dietQuality: item.dietQuality ?? item.dietScore,
      remark: item.remark ?? item.diary
    }))
  }
}

const healthApi = {
  submitCheckin(params) {
    return http.post('/api/health/checkin', params)
  },

  async getTodayCheckin() {
    const res = await http.get('/api/health/checkin/today', {}, { showLoading: false, showError: false })
    return {
      ...res,
      data: normalizeTodayCheckin(res?.data)
    }
  },

  async getCheckinHistory(params = {}) {
    const res = await http.get('/api/health/checkins', {
      page: params.page || 1,
      size: params.size || 10
    })
    return {
      ...res,
      data: normalizeHistory(res?.data)
    }
  },

  async getHealthScore() {
    const res = await http.get('/api/health/score', {}, { showLoading: false })
    return {
      ...res,
      data: normalizeScore(res?.data)
    }
  },

  async getStreakDays() {
    const res = await http.get('/api/health/streak', {}, { showLoading: false })
    return {
      ...res,
      data: normalizeStreak(res?.data)
    }
  },

  getCheckinStats(period = 'week') {
    return http.get('/api/health/stats', { period })
  },

  getTrend(days = 30) {
    return http.get('/api/health/trend', { days })
  },

  async getStats() {
    const res = await http.get('/api/health/statistics', {}, { showLoading: false })
    return {
      ...res,
      data: normalizeStats(res?.data)
    }
  }
}

export default healthApi
