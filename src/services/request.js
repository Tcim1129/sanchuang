import Taro from '@tarojs/taro'

const ENV_BASE_URL =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.TARO_APP_BASE_URL
    ? process.env.TARO_APP_BASE_URL
    : ''

const DEFAULT_BASE_URL = ENV_BASE_URL || 'https://sanchuang1.tcim.me'
const IS_DEV_ENV =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV === 'development'
const ENABLE_HTTP_FALLBACK = IS_DEV_ENV

let runtimeBaseUrl = DEFAULT_BASE_URL

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

const toHttpUrl = (url = '') => url.replace('https://', 'http://')

const shouldRetryWithHttp = (config, err) => {
  if (!ENABLE_HTTP_FALLBACK) return false
  if (config.__httpFallbackTried) return false
  if (!String(config.url || '').startsWith('https://')) return false

  const msg = String(err?.errMsg || err?.message || '').toLowerCase()
  return (
    msg.includes('request:fail') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('ssl') ||
    msg.includes('tls') ||
    msg.includes('connection') ||
    msg.includes('closed')
  )
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
    timeout = 30000,
    __httpFallbackTried = false
  } = options

  if (!url.startsWith('http')) {
    url = `${runtimeBaseUrl}${url}`
  }

  let config = {
    url,
    method: method.toUpperCase(),
    data,
    header,
    showLoading,
    showError,
    timeout,
    __httpFallbackTried
  }

  config = requestInterceptor(config)

  return new Promise((resolve, reject) => {
    const send = (requestConfig) => {
      Taro.request({
        url: requestConfig.url,
        method: requestConfig.method,
        data: requestConfig.data,
        header: requestConfig.header,
        timeout: requestConfig.timeout,
        success: (res) => {
          try {
            const result = responseInterceptor(res, requestConfig)
            Promise.resolve(result).then(resolve).catch(reject)
          } catch (err) {
            reject(err)
          }
        },
        fail: (err) => {
          if (shouldRetryWithHttp(requestConfig, err)) {
            const fallbackUrl = toHttpUrl(requestConfig.url)
            if (fallbackUrl !== requestConfig.url) {
              runtimeBaseUrl = toHttpUrl(runtimeBaseUrl)
              send({
                ...requestConfig,
                url: fallbackUrl,
                __httpFallbackTried: true
              })
              return
            }
          }

          if (requestConfig.showLoading !== false) {
            decLoading()
          }

          if (requestConfig.showError !== false) {
            Taro.showToast({
              title: '网络连接失败，请检查后端服务与HTTPS配置',
              icon: 'none',
              duration: 2500
            })
          }

          reject({ code: -1, message: err.errMsg || '网络错误' })
        }
      })
    }

    send(config)
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
