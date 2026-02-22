import http from './request'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value.records)) return value.records
  if (Array.isArray(value.list)) return value.list
  if (Array.isArray(value.items)) return value.items
  if (Array.isArray(value.data)) return value.data
  return []
}

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizeRecommendation = (item) => {
  if (typeof item === 'string') return item
  if (!item || typeof item !== 'object') return ''

  const title = item.name || item.title || item.question || item.text || ''
  const reason = item.reason || item.description || ''

  if (!title && !reason) return ''
  if (!title) return reason
  if (!reason) return title
  return `${title}：${reason}`
}

const normalizeConsultData = (data = {}) => {
  const rawRecommendations = data.recommendations || data.recommendedServices || data.recommendList || []
  const recommendations = getArray(rawRecommendations)
    .map(normalizeRecommendation)
    .filter(Boolean)

  return {
    ...data,
    answer: data.answer || data.content || data.reply || '',
    recommendations,
    recommendedServices: getArray(data.recommendedServices)
  }
}

const normalizePageData = (data = {}) => {
  const records = getArray(data)

  if (Array.isArray(data)) {
    return {
      records,
      total: records.length,
      size: records.length,
      current: 1,
      pages: 1
    }
  }

  return {
    ...data,
    records,
    total: toNumber(data.total, records.length),
    size: toNumber(data.size, records.length),
    current: toNumber(data.current, 1),
    pages: toNumber(data.pages, 1)
  }
}

const normalizeQuickQuestion = (item) => {
  if (typeof item === 'string') return item
  if (!item || typeof item !== 'object') return ''
  return item.question || item.title || item.content || item.text || ''
}

const shouldRetryConsult = (error) => {
  const code = Number(error?.code)
  const message = String(error?.message || '').toLowerCase()
  return code === -1 || code >= 500 || message.includes('timeout') || message.includes('network')
}

const aiApi = {
  async consult(params) {
    let lastError

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await http.post('/api/ai/consult', params, {
          showLoading: false,
          showError: false,
          timeout: 60000
        })

        return {
          ...res,
          data: normalizeConsultData(res?.data)
        }
      } catch (error) {
        lastError = error
        if (attempt === 1 || !shouldRetryConsult(error)) {
          throw error
        }
        await wait(600)
      }
    }

    throw lastError || new Error('AI服务不可用')
  },

  async getHistory(params = {}) {
    const res = await http.get('/api/ai/history', {
      page: params.page || 1,
      size: params.size || 20
    }, {
      showError: false
    })

    return {
      ...res,
      data: normalizePageData(res?.data)
    }
  },

  async getQuickQuestions() {
    const res = await http.get('/api/ai/questions', {}, {
      showLoading: false,
      showError: false
    })

    return {
      ...res,
      data: getArray(res?.data).map(normalizeQuickQuestion).filter(Boolean)
    }
  }
}

export default aiApi
