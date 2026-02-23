const fs = require('fs')

const code = fs.readFileSync('src/services/request.js', 'utf8')
const failures = []

if (!code.includes('runtimeBaseUrl')) {
  failures.push('缺少运行时 baseUrl（runtimeBaseUrl），无法在 HTTPS 失败后切换')
}

if (!code.includes('shouldRetryWithHttp')) {
  failures.push('缺少 shouldRetryWithHttp 逻辑，无法自动降级到 HTTP')
}

if (!code.includes("replace('https://', 'http://')")) {
  failures.push('缺少 HTTPS -> HTTP 退化处理')
}

if (!code.includes('NODE_ENV')) {
  failures.push('缺少环境判断，无法限制仅开发环境启用降级')
}

if (failures.length) {
  console.error('Network fallback check failed:')
  failures.forEach((f, i) => console.error(`${i + 1}. ${f}`))
  process.exit(1)
}

console.log('Network fallback check passed')
