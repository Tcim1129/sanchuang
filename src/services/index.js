/**
 * API 统一导出
 *
 * 使用示例：
 *   import api from '@/services'
 *   const res = await api.user.wxLogin({ code })
 *   const data = await api.health.submitCheckin({ moodScore: 8 })
 *   const reply = await api.ai.consult({ question: '怎么改善睡眠？' })
 */

import userApi from './user'
import healthApi from './health'
import aiApi from './ai'
import partnerApi from './partner'
import http from './request'

export { userApi, healthApi, aiApi, partnerApi, http }

export default {
  user: userApi,
  health: healthApi,
  ai: aiApi,
  partner: partnerApi,
  http
}
