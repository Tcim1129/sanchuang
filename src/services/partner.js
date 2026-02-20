import http from './request'

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const getArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value.records)) return value.records
  if (Array.isArray(value.list)) return value.list
  if (Array.isArray(value.items)) return value.items
  if (Array.isArray(value.data)) return value.data
  return []
}

const normalizeRelationshipStatus = (data = {}) => ({
  relationshipId: data.relationshipId ?? data.id ?? null,
  hasPartner: Boolean(data.hasPartner),
  status: data.status || '',
  bindStatus: data.bindStatus || '',
  partnerId: data.partnerId ?? null,
  partnerNickname: data.partnerNickname || data.partnerName || '',
  partnerAvatar: data.partnerAvatar || data.avatar || '',
  inviteCode: data.inviteCode || '',
  startDate: data.startDate || '',
  healthScore: toNumber(data.healthScore, 50),
  sharedCheckinDays: toNumber(data.sharedCheckinDays),
  createTime: data.createTime || ''
})

const normalizePartnerCheckinStatus = (data = {}) => ({
  date: data.date || '',
  meCompleted: Boolean(data.meCompleted ?? data.selfCompleted ?? data.userCompleted),
  partnerCompleted: Boolean(data.partnerCompleted),
  myMoodScore: toNumber(data.myMoodScore),
  partnerMoodScore: toNumber(data.partnerMoodScore),
  bothCompleted: Boolean(data.bothCompleted)
})

const normalizePartnerCheckinRecord = (item = {}) => ({
  date: item.date || item.checkinDate || '',
  bothCompleted: Boolean(item.bothCompleted),
  myMoodScore: toNumber(item.myMoodScore ?? item.moodScore),
  partnerMoodScore: toNumber(item.partnerMoodScore),
  myEmotionType: item.myEmotionType || '',
  partnerEmotionType: item.partnerEmotionType || ''
})

const normalizeRelationshipHealth = (data = {}) => ({
  overallScore: toNumber(data.overallScore),
  moodAlignment: toNumber(data.moodAlignment),
  checkinConsistency: toNumber(data.checkinConsistency),
  communicationScore: toNumber(data.communicationScore),
  contractCompletion: toNumber(data.contractCompletion),
  suggestion: data.suggestion || ''
})

const normalizeContract = (item = {}) => ({
  ...item,
  id: item.id ?? null,
  title: item.title || '',
  content: item.content || '',
  targetValue: item.targetValue || '',
  rewardPoints: toNumber(item.rewardPoints),
  status: item.status || '',
  progress: toNumber(item.progress),
  creatorCompleted: toNumber(item.creatorCompleted),
  partnerCompleted: toNumber(item.partnerCompleted)
})

const normalizePoints = (data = {}) => ({
  totalPoints: toNumber(data.totalPoints),
  availablePoints: toNumber(data.availablePoints),
  usedPoints: toNumber(data.usedPoints),
  rank: toNumber(data.rank)
})

const normalizePointsRecord = (item = {}) => ({
  ...item,
  id: item.id ?? null,
  points: toNumber(item.points ?? item.changePoints),
  type: item.type || '',
  description: item.description || item.reason || '积分变动',
  createTime: item.createTime || item.time || ''
})

const partnerApi = {
  generateInviteCode() {
    return http.post('/api/partner/invite-code')
  },

  bindPartner(inviteCode) {
    return http.post('/api/partner/bind', { inviteCode })
  },

  async getRelationshipStatus() {
    const res = await http.get('/api/partner/status', {}, { showLoading: false })
    return {
      ...res,
      data: normalizeRelationshipStatus(res?.data)
    }
  },

  respondToBindRequest(relationshipId, accept) {
    return http.post('/api/partner/respond', { relationshipId, accept })
  },

  unbindPartner(relationshipId) {
    return http.post(`/api/partner/unbind/${relationshipId}`)
  },

  async getPartnerCheckinStatus() {
    const res = await http.get('/api/partner/checkin/today', {}, { showLoading: false })
    return {
      ...res,
      data: normalizePartnerCheckinStatus(res?.data)
    }
  },

  async getPartnerCheckinHistory(params = {}) {
    const res = await http.get('/api/partner/checkin/history', {
      page: params.page || 1,
      size: params.size || 10
    })

    return {
      ...res,
      data: getArray(res?.data).map(normalizePartnerCheckinRecord)
    }
  },

  async getRelationshipHealth() {
    const res = await http.get('/api/partner/health', {}, { showLoading: false })
    return {
      ...res,
      data: normalizeRelationshipHealth(res?.data)
    }
  },

  createContract(data) {
    return http.post('/api/partner/contracts', data)
  },

  async listContracts(status) {
    const params = status ? { status } : {}
    const res = await http.get('/api/partner/contracts', params, { showLoading: false })
    return {
      ...res,
      data: getArray(res?.data).map(normalizeContract)
    }
  },

  completeContract(contractId, data) {
    return http.post(`/api/partner/contracts/${contractId}/complete`, data)
  },

  confirmContract(contractId, recordId, accept) {
    return http.post(`/api/partner/contracts/${contractId}/confirm`, { recordId, accept })
  },

  cancelContract(contractId) {
    return http.post(`/api/partner/contracts/${contractId}/cancel`)
  },

  async getPoints() {
    const res = await http.get('/api/partner/points', {}, { showLoading: false })
    return {
      ...res,
      data: normalizePoints(res?.data)
    }
  },

  async listPointsRecords(params = {}) {
    const res = await http.get('/api/partner/points/records', {
      page: params.page || 1,
      size: params.size || 10
    })

    return {
      ...res,
      data: getArray(res?.data).map(normalizePointsRecord)
    }
  }
}

export default partnerApi
