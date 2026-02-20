/**
 * 工具函数
 */
import Taro from '@tarojs/taro'

/**
 * 格式化日期
 * @param {Date|string|number} date
 * @param {string} fmt - 格式，默认 'YYYY-MM-DD'
 */
export function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  }
  let result = fmt
  Object.keys(map).forEach(key => {
    result = result.replace(key, map[key])
  })
  return result
}

/**
 * 防抖
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 检查登录状态
 */
export function isLoggedIn() {
  return !!Taro.getStorageSync('token')
}

/**
 * 获取本地存储的用户信息
 */
export function getLocalUserInfo() {
  try {
    return JSON.parse(Taro.getStorageSync('userInfo') || '{}')
  } catch {
    return {}
  }
}

/**
 * 保存登录信息
 */
export function saveLoginInfo(token, userInfo) {
  Taro.setStorageSync('token', token)
  if (userInfo) {
    Taro.setStorageSync('userInfo', JSON.stringify(userInfo))
  }
}

/**
 * 清除登录信息
 */
export function clearLoginInfo() {
  Taro.removeStorageSync('token')
  Taro.removeStorageSync('userInfo')
}

/**
 * 手机号验证
 */
export function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 获取心情 emoji
 */
export function getMoodEmoji(score) {
  const emojis = ['', '😭', '😢', '😞', '🙁', '😕', '😐', '🙂', '😊', '😄', '🤩']
  return emojis[score] || '😐'
}

/**
 * 获取心情文字描述
 */
export function getMoodText(score) {
  const texts = ['', '非常糟糕', '很差', '较差', '不太好', '一般', '还行', '不错', '很好', '非常好', '超棒']
  return texts[score] || '未知'
}

/**
 * 获取情绪类型文字
 */
export function getEmotionText(type) {
  const map = {
    'HAPPY': '开心',
    'CALM': '平静',
    'ANXIOUS': '焦虑',
    'DEPRESSED': '抑郁',
    'ANGRY': '愤怒'
  }
  return map[type] || type
}

/**
 * 获取健康评分颜色
 */
export function getScoreColor(score) {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FF9800'
  return '#F44336'
}
