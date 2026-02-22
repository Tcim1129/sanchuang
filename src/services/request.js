import Taro from '@tarojs/taro'

const ENV_BASE_URL =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.TARO_APP_BASE_URL
    ? process.env.TARO_APP_BASE_URL
    : ''

const DEFAULT_BASE_URL = ENV_BASE_URL || 'https://sanchuang1.tcim.me'

const WHITE_LIST = [
  '/api/user/login',
  '/api/user/login/password',
  '/api/user/login/phone',
  '/api/user/login/wechat',
  '/api/user/register',
  '/api/user/sms/send'
]

let requestCount = 0

const decLoading = () => {
  requestCount -= 1
  if (requestCount <= 0) {
    requestCount = 0
    Taro.hideLoading()
  }
}

const getPathname = (url = '') => {
  if (!url) return ''

  if (url.startsWith('/')) {
    return url.split('?')[0]
  }

  try {
    return new URL(url).pathname
  } catch {
    return url.split('?')[0]
  }
}

const requestInterceptor = (options) => {
  const token = Taro.getStorageSync('token')
  const header = {
    ...(options.header || {})
  }

  const path = getPathname(options.url)
  if (token && !WHITE_LIST.includes(path)) {
    header.Authorization = `Bearer ${token}`
  }

  if (!header['Content-Type']) {
    header['Content-Type'] = 'application/json'
  }

  if (options.showLoading !== false) {
    requestCount += 1
    if (requestCount === 1) {
      Taro.showLoading({ title: '加载中...', mask: true })
    }
  }

  return {
    ...options,
    header
  }
}

const responseInterceptor = (response, options) => {
  if (options.showLoading !== false) {
    decLoading()
  }

  const { statusCode, data } = response

  if (statusCode === 401) {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 })
    setTimeout(() => {
      Taro.reLaunch({ url: '/pages/login/index' })
    }, 1500)
    return Promise.reject({ code: 401, message: '登录已过期' })
  }

  if (statusCode === 403) {
    if (options.showError !== false) {
      Taro.showToast({ title: '没有权限访问', icon: 'none' })
    }
    return Promise.reject({ code: 403, message: '没有权限' })
  }

  if (statusCode >= 500) {
    if (options.showError !== false) {
      Taro.showToast({ title: '服务器繁忙，请稍后再试', icon: 'none' })
    }
    return Promise.reject({ code: statusCode, message: data?.message || '服务器错误' })
  }

  if (statusCode !== 200) {
    if (options.showError !== false) {
      Taro.showToast({ title: data?.message || '请求失败', icon: 'none' })
    }
    return Promise.reject({ code: statusCode, message: data?.message || '请求失败' })
  }

  if (data?.code !== undefined && data.code !== 200) {
    if (options.showError !== false) {
      Taro.showToast({ title: data.message || '操作失败', icon: 'none' })
    }
    return Promise.reject({ code: data.code, message: data.message || '操作失败' })
  }

  return data
}

function request(options) {
  let {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = true,
    showError = true,
    timeout = 30000
  } = options

  if (!url.startsWith('http')) {
    url = `${DEFAULT_BASE_URL}${url}`
  }

  let config = {
    url,
    method: method.toUpperCase(),
    data,
    header,
    showLoading,
    showError,
    timeout
  }

  config = requestInterceptor(config)

  return new Promise((resolve, reject) => {
    Taro.request({
      url: config.url,
      method: config.method,
      data: config.data,
      header: config.header,
      timeout: config.timeout,
      success: (res) => {
        try {
          const result = responseInterceptor(res, config)
          Promise.resolve(result).then(resolve).catch(reject)
        } catch (err) {
          reject(err)
        }
      },
      fail: (err) => {
        if (config.showLoading !== false) {
          decLoading()
        }

        if (config.showError !== false) {
          Taro.showToast({
            title: '网络连接失败，请检查网络',
            icon: 'none',
            duration: 2000
          })
        }

        reject({ code: -1, message: err.errMsg || '网络错误' })
      }
    })
  })
}

const get = (url, data = {}, options = {}) => request({ url, method: 'GET', data, ...options })
const post = (url, data = {}, options = {}) => request({ url, method: 'POST', data, ...options })
const put = (url, data = {}, options = {}) => request({ url, method: 'PUT', data, ...options })
const del = (url, data = {}, options = {}) => request({ url, method: 'DELETE', data, ...options })

export default {
  request,
  get,
  post,
  put,
  del,
  BASE_URL: DEFAULT_BASE_URL
}
