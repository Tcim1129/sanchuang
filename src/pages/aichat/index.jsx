import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { AtIcon, AtToast } from 'taro-ui'
import MessageItem from '../../components/MessageItem'
import { aiApi } from '../../services'
import './index.scss'

// 快捷问题
const QUICK_QUESTIONS = [
  '最近睡眠不好怎么办？',
  '如何缓解焦虑情绪？',
  '推荐一些运动方式',
  '情绪低落怎么调整？',
  '怎么养成健康饮食习惯？',
  '如何管理压力？'
]

export default class AIChat extends Component {

  state = {
    messages: [
      {
        id: 'welcome',
        type: 'ai',
        content: '你好！我是亲健AI健康咨询师，可以帮你解答健康相关的问题。你可以直接输入问题，或者点击下方的快捷问题开始咨询。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
    ],
    inputValue: '',
    loading: false,
    scrollToId: 'welcome',
    // 提示
    toastOpen: false,
    toastText: ''
  }

  messageIdCounter = 0

  generateId = () => {
    this.messageIdCounter++
    return `msg_${Date.now()}_${this.messageIdCounter}`
  }

  // ==================== 发送消息 ====================

  handleInputChange = (e) => {
    this.setState({ inputValue: e.detail.value })
  }

  handleSend = () => {
    const { inputValue, loading } = this.state

    if (loading) return
    const question = inputValue.trim()
    if (!question) return

    this.sendMessage(question)
  }

  handleQuickQuestion = (question) => {
    if (this.state.loading) return
    this.sendMessage(question)
  }

  sendMessage = async (question) => {
    const userMsgId = this.generateId()
    const aiMsgId = this.generateId()
    const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    // 1. 添加用户消息
    this.setState(prev => ({
      messages: [...prev.messages, {
        id: userMsgId,
        type: 'user',
        content: question,
        time: currentTime
      }],
      inputValue: '',
      loading: true,
      scrollToId: userMsgId
    }))

    // 2. 添加 AI "正在输入" 占位
    setTimeout(() => {
      this.setState(prev => ({
        messages: [...prev.messages, {
          id: aiMsgId,
          type: 'ai',
          content: '',
          loading: true,
          time: ''
        }],
        scrollToId: aiMsgId
      }))
    }, 300)

    // 3. 调用后端 AI 接口
    try {
      const res = await aiApi.consult({ question })
      const aiTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

      // 更新 AI 消息
      this.setState(prev => ({
        messages: prev.messages.map(msg =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: res.data?.answer || res.data || '抱歉，暂时无法回答这个问题。',
                loading: false,
                time: aiTime,
                recommendations: res.data?.recommendations || []
              }
            : msg
        ),
        loading: false,
        scrollToId: aiMsgId
      }))

    } catch (err) {
      console.error('AI咨询失败：', err)

      // 更新为错误消息
      this.setState(prev => ({
        messages: prev.messages.map(msg =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: '网络繁忙，请稍后再试。你也可以重新发送消息。',
                loading: false,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                error: true
              }
            : msg
        ),
        loading: false
      }))
    }
  }

  // ==================== 重新发送 ====================

  handleRetry = (messageIndex) => {
    const { messages } = this.state
    // 找到这条错误消息前面的用户消息
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        // 移除错误的 AI 消息
        const newMessages = messages.filter((_, idx) => idx !== messageIndex)
        this.setState({ messages: newMessages }, () => {
          this.sendMessage(messages[i].content)
        })
        break
      }
    }
  }

  showToast = (text) => {
    this.setState({ toastOpen: true, toastText: text })
    setTimeout(() => this.setState({ toastOpen: false }), 2000)
  }

  // ==================== 渲染 ====================

  render() {
    const { messages, inputValue, loading, scrollToId, toastOpen, toastText } = this.state

    return (
      <View className='aichat-page'>
        {/* 消息列表 */}
        <ScrollView
          className='message-list'
          scrollY
          scrollIntoView={scrollToId}
          scrollWithAnimation
          enhanced
          showScrollbar={false}
        >
          {messages.map((msg, index) => (
            <View key={msg.id} id={msg.id}>
              <MessageItem
                message={msg}
                onRetry={() => this.handleRetry(index)}
              />
            </View>
          ))}
          <View className='message-bottom-spacer' />
        </ScrollView>

        {/* 快捷问题栏 */}
        <View className='quick-section'>
          <ScrollView
            className='quick-scroll'
            scrollX
            enhanced
            showScrollbar={false}
          >
            <View className='quick-list'>
              {QUICK_QUESTIONS.map((q, index) => (
                <View
                  key={index}
                  className='quick-item'
                  onClick={() => this.handleQuickQuestion(q)}
                >
                  <Text className='quick-text'>{q}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 底部输入框 */}
        <View className='input-section'>
          <View className='input-wrapper'>
            <Input
              className='message-input'
              placeholder='输入你的问题...'
              value={inputValue}
              onInput={this.handleInputChange}
              confirmType='send'
              onConfirm={this.handleSend}
              disabled={loading}
            />
            <View
              className={`send-btn ${(!inputValue.trim() || loading) ? 'disabled' : ''}`}
              onClick={this.handleSend}
            >
              <AtIcon
                value='lightning-bolt'
                size='22'
                color={(!inputValue.trim() || loading) ? '#CCCCCC' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* Toast */}
        <AtToast
          isOpened={toastOpen}
          text={toastText}
          icon='close-circle'
          duration={2000}
        />
      </View>
    )
  }
}
