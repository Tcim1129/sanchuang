/**
 * 用户相关 API
 */
import http from './request'

const userApi = {
  /**
   * 微信登录
   * @param {Object} params - { code: 微信登录凭证 }
   * @returns {Promise<{ token, userInfo }>}
   */
  wxLogin(params) {
    return http.post('/api/user/login/wechat', params, { showLoading: true })
  },

  /**
   * 发送短信验证码
   * @param {string} phone - 手机号
   */
  sendSmsCode(phone) {
    return http.post('/api/user/sms/send', { phone })
  },

  /**
   * 手机号+验证码登录
   * @param {Object} params - { phone, code }
   */
  phoneLogin(params) {
    return http.post('/api/user/login/phone', params)
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return http.get('/api/user/info')
  },

  /**
   * 更新用户信息
   * @param {Object} params - { nickname, avatar, gender, birthday }
   */
  updateUserInfo(params) {
    return http.put('/api/user/info', params)
  },

  /**
   * 退出登录
   */
  logout() {
    return http.post('/api/user/logout')
  }
}

export default userApi
