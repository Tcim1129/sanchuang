import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import { AtIcon, AtActivityIndicator } from 'taro-ui'
import './index.scss'

/**
 * 消息气泡组件
 *
 * Props:
 *   message: {
 *     id: string,
 *     type: 'user' | 'ai',
 *     content: string,
 *     time: string,
 *     loading?: boolean,
 *     error?: boolean,
 *     recommendations?: string[]
 *   }
 *   onRetry: () => void
 */
export default class MessageItem extends Component {

  render() {
    const { message, onRetry } = this.props
    const { type, content, time, loading, error, recommendations } = message
    const isUser = type === 'user'

    return (
      <View className={`message-item ${isUser ? 'message-user' : 'message-ai'}`}>
        {/* 头像 */}
        <View className='message-avatar'>
          {isUser ? (
            <View className='avatar avatar-user'>
              <AtIcon value='user' size='20' color='#fff' />
            </View>
          ) : (
            <View className='avatar avatar-ai'>
              <Text className='avatar-text'>AI</Text>
            </View>
          )}
        </View>

        {/* 消息体 */}
        <View className='message-body'>
          {/* 气泡 */}
          <View className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-ai'} ${error ? 'bubble-error' : ''}`}>
            {loading ? (
              <View className='loading-dots'>
                <AtActivityIndicator size={24} color='#4CAF50' content='正在思考...' />
              </View>
            ) : (
              <Text className='message-text' selectable>
                {content}
              </Text>
            )}
          </View>

          {/* 推荐问题 */}
          {!loading && recommendations && recommendations.length > 0 && (
            <View className='recommendations'>
              <Text className='rec-title'>相关建议：</Text>
              {recommendations.map((rec, index) => (
                <Text key={index} className='rec-item'>
                  {index + 1}. {rec}
                </Text>
              ))}
            </View>
          )}

          {/* 错误重试 */}
          {error && (
            <View className='retry-bar' onClick={onRetry}>
              <AtIcon value='reload' size='14' color='#F44336' />
              <Text className='retry-text'>发送失败，点击重试</Text>
            </View>
          )}

          {/* 时间 */}
          {time && !loading && (
            <Text className='message-time'>{time}</Text>
          )}
        </View>
      </View>
    )
  }
}
