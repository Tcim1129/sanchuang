import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import MessageItem from '../../components/MessageItem'
import { aiApi } from '../../services'
import './index.scss'

const QUICK_QUESTIONS = [
  '最近睡眠不太好怎么办？',
  '如何缓解焦虑情绪？',
  '推荐一些简单运动方式',
  '情绪低落时怎么调整？',
  '怎么养成健康饮食习惯？',
  '如何更好地管理压力？'
]

const getTimeText = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

const toUserFriendlyError = (err) => {
  if (!err) return '网络繁忙，请稍后再试。'

  const code = Number(err.code)
  const msg = String(err.message || '')

  if (code === 401) return '登录已过期，请重新登录后再试。'
  if (code === 403) return '当前账号没有 AI 功能权限。'
  if (code >= 500) return 'AI 服务暂时繁忙，请稍后重试。'
  if (code === -1) return '网络连接不稳定，请检查网络后重试。'
  if (msg) return msg

  return 'AI 服务暂时不可用，请稍后再试。'
}

export default class AIChat extends Component {
  state = {
    messages: [
      {
        id: 'welcome',
        type: 'ai',
        content: '你好，我是亲健 AI 咨询师。你可以直接输入问题，或点击下方快捷问题开始。',
        time: getTimeText()
      }
    ],
    inputValue: '',
    loading: false,
    scrollToId: 'welcome'
  }

  messageIdCounter = 0

  generateId = () => {
    this.messageIdCounter += 1
    return `msg_${Date.now()}_${this.messageIdCounter}`
  }

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

    this.setState(prev => ({
      messages: [
        ...prev.messages,
        {
          id: userMsgId,
          type: 'user',
          content: question,
          time: getTimeText()
        },
        {
          id: aiMsgId,
          type: 'ai',
          content: '',
          loading: true,
          time: ''
        }
      ],
      inputValue: '',
      loading: true,
      scrollToId: aiMsgId
    }))

    try {
      const res = await aiApi.consult({ question })
      const answer = res?.data?.answer || '抱歉，我暂时无法回答这个问题。'
      const recommendations = Array.isArray(res?.data?.recommendations) ? res.data.recommendations : []

      this.setState(prev => ({
        messages: prev.messages.map(msg =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: answer,
                loading: false,
                error: false,
                time: getTimeText(),
                recommendations
              }
            : msg
        ),
        loading: false,
        scrollToId: aiMsgId
      }))
    } catch (err) {
      const errorText = toUserFriendlyError(err)

      this.setState(prev => ({
        messages: prev.messages.map(msg =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: errorText,
                loading: false,
                error: true,
                time: getTimeText()
              }
            : msg
        ),
        loading: false,
        scrollToId: aiMsgId
      }))
    }
  }

  handleRetry = (messageIndex) => {
    const { messages } = this.state

    for (let i = messageIndex - 1; i >= 0; i -= 1) {
      if (messages[i].type === 'user') {
        const retryQuestion = messages[i].content
        const newMessages = messages.filter((_, idx) => idx !== messageIndex)
        this.setState({ messages: newMessages }, () => {
          this.sendMessage(retryQuestion)
        })
        break
      }
    }
  }

  render() {
    const { messages, inputValue, loading, scrollToId } = this.state

    return (
      <View className='aichat-page'>
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
              <MessageItem message={msg} onRetry={() => this.handleRetry(index)} />
            </View>
          ))}
          <View className='message-bottom-spacer' />
        </ScrollView>

        <View className='quick-section'>
          <ScrollView className='quick-scroll' scrollX enhanced showScrollbar={false}>
            <View className='quick-list'>
              {QUICK_QUESTIONS.map((q, index) => (
                <View key={index} className='quick-item' onClick={() => this.handleQuickQuestion(q)}>
                  <Text className='quick-text'>{q}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

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
            <View className={`send-btn ${(!inputValue.trim() || loading) ? 'disabled' : ''}`} onClick={this.handleSend}>
              <AtIcon
                value='lightning-bolt'
                size='22'
                color={(!inputValue.trim() || loading) ? '#CCCCCC' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>
      </View>
    )
  }
}
