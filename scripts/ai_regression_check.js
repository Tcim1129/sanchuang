const fs = require('fs')

const aiServicePath = 'src/services/ai.js'
const aiPagePath = 'src/pages/aichat/index.jsx'

const aiServiceCode = fs.readFileSync(aiServicePath, 'utf8')
const aiPageCode = fs.readFileSync(aiPagePath, 'utf8')

const failures = []

if (!aiServiceCode.includes("showError: false")) {
  failures.push('consult 接口未关闭全局错误弹窗（showError: false 缺失）')
}

if (aiPageCode.includes('setTimeout(() => {')) {
  failures.push('sendMessage 仍使用延迟 setTimeout 插入 AI 占位消息，存在竞态风险')
}

if (!aiPageCode.includes("id: aiMsgId") || !aiPageCode.includes("loading: true")) {
  failures.push('AI 占位消息结构缺失，无法保证请求中状态稳定')
}

if (failures.length > 0) {
  console.error('AI regression check failed:')
  failures.forEach((f, i) => console.error(`${i + 1}. ${f}`))
  process.exit(1)
}

console.log('AI regression check passed')
