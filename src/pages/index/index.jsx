import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtIcon, AtProgress } from 'taro-ui'
import { healthApi } from '../../services'
import { getLocalUserInfo, getMoodEmoji, getScoreColor, formatDate } from '../../utils'
import './index.scss'

export default class Index extends Component {
  state = {
    userInfo: {},
    todayCheckin: null,
    healthScore: 0,
    streakDays: 0,
    loading: true
  }

  componentDidShow() {
    this.loadData()
  }

  onPullDownRefresh() {
    this.loadData().then(() => {
      Taro.stopPullDownRefresh()
    })
  }

  loadData = async () => {
    this.setState({ loading: true })

    try {
      const userInfo = getLocalUserInfo()
      this.setState({ userInfo })

      const [todayRes, scoreRes, streakRes] = await Promise.allSettled([
        healthApi.getTodayCheckin(),
        healthApi.getHealthScore(),
        healthApi.getStreakDays()
      ])

      this.setState({
        todayCheckin: todayRes.status === 'fulfilled' ? todayRes.value?.data : null,
        healthScore: scoreRes.status === 'fulfilled' ? (scoreRes.value?.data?.score || 0) : 0,
        streakDays: streakRes.status === 'fulfilled' ? (streakRes.value?.data?.days || 0) : 0
      })
    } catch (err) {
      console.error('load home data failed', err)
    } finally {
      this.setState({ loading: false })
    }
  }

  navigateToCheckin = () => {
    Taro.switchTab({ url: '/pages/checkin/index' })
  }

  navigateToAI = () => {
    Taro.switchTab({ url: '/pages/aichat/index' })
  }

  navigateToHistory = () => {
    Taro.switchTab({ url: '/pages/mine/index' })
  }

  navigateToStatistics = () => {
    Taro.navigateTo({ url: '/pages/statistics/index' })
  }

  getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  render() {
    const { userInfo, todayCheckin, healthScore, streakDays } = this.state
    const hasCheckedIn = !!todayCheckin?.hasChecked
    const currentCheckin = todayCheckin?.checkin || null
    const scoreColor = getScoreColor(healthScore)
    const today = formatDate(new Date(), 'MM-DD')

    return (
      <View className='index-page'>
        <View className='header-section'>
          <View className='greeting'>
            <Text className='greeting-text'>
              {this.getGreeting()}，{userInfo.nickname || '用户'}
            </Text>
            <Text className='date-text'>{today}</Text>
          </View>
        </View>

        <View className='score-card card'>
          <View className='score-header'>
            <Text className='score-title'>健康评分</Text>
            <Text className='streak-badge'>
              <AtIcon value='lightning-bolt' size='14' color='#FF9800' />
              连续{streakDays}天
            </Text>
          </View>
          <View className='score-body'>
            <View className='score-circle' style={{ borderColor: scoreColor }}>
              <Text className='score-number' style={{ color: scoreColor }}>
                {healthScore}
              </Text>
              <Text className='score-unit'>分</Text>
            </View>
            <View className='score-detail'>
              <AtProgress
                percent={healthScore}
                strokeWidth={8}
                color={scoreColor}
                isHidePercent
              />
              <Text className='score-desc'>
                {healthScore >= 80 ? '状态很好，继续保持' :
                  healthScore >= 60 ? '状态一般，注意调整' :
                    healthScore > 0 ? '状态偏低，建议咨询' : '完成打卡获取评分'}
              </Text>
            </View>
          </View>
        </View>

        <View
          className={`checkin-card card ${hasCheckedIn ? 'checked' : ''}`}
          onClick={this.navigateToCheckin}
        >
          <View className='checkin-content'>
            <View className='checkin-left'>
              <Text className='checkin-icon'>
                {hasCheckedIn ? getMoodEmoji(currentCheckin?.moodScore) : '📝'}
              </Text>
            </View>
            <View className='checkin-center'>
              <Text className='checkin-title'>
                {hasCheckedIn ? '今日已打卡' : '今日健康打卡'}
              </Text>
              <Text className='checkin-desc'>
                {hasCheckedIn
                  ? `心情 ${currentCheckin?.moodScore || '-'} /10 · 睡眠 ${currentCheckin?.sleepHours || '-'}h · 运动 ${currentCheckin?.exerciseMinutes || 0}min`
                  : '记录今天的心情、睡眠和运动情况'}
              </Text>
            </View>
            <View className='checkin-right'>
              <AtIcon
                value={hasCheckedIn ? 'check-circle' : 'chevron-right'}
                size='24'
                color={hasCheckedIn ? '#43A047' : '#CCCCCC'}
              />
            </View>
          </View>
        </View>

        <View className='shortcuts-section'>
          <Text className='section-title'>快捷入口</Text>
          <View className='shortcuts-grid'>
            <View className='shortcut-item' onClick={this.navigateToCheckin}>
              <View className='shortcut-icon' style={{ background: 'linear-gradient(135deg, #43A047, #66BB6A)' }}>
                <AtIcon value='edit' size='28' color='#fff' />
              </View>
              <Text className='shortcut-label'>健康打卡</Text>
            </View>

            <View className='shortcut-item' onClick={this.navigateToAI}>
              <View className='shortcut-icon' style={{ background: 'linear-gradient(135deg, #42A5F5, #1E88E5)' }}>
                <AtIcon value='message' size='28' color='#fff' />
              </View>
              <Text className='shortcut-label'>AI 咨询</Text>
            </View>

            <View className='shortcut-item' onClick={this.navigateToHistory}>
              <View className='shortcut-icon' style={{ background: 'linear-gradient(135deg, #FFA726, #FF9800)' }}>
                <AtIcon value='calendar' size='28' color='#fff' />
              </View>
              <Text className='shortcut-label'>打卡记录</Text>
            </View>

            <View className='shortcut-item' onClick={this.navigateToStatistics}>
              <View className='shortcut-icon' style={{ background: 'linear-gradient(135deg, #26A69A, #00897B)' }}>
                <AtIcon value='analytics' size='28' color='#fff' />
              </View>
              <Text className='shortcut-label'>数据统计</Text>
            </View>

            <View className='shortcut-item' onClick={() => Taro.navigateTo({ url: '/pages/partner/index' })}>
              <View className='shortcut-icon' style={{ background: 'linear-gradient(135deg, #E91E63, #F06292)' }}>
                <AtIcon value='heart' size='28' color='#fff' />
              </View>
              <Text className='shortcut-label'>双人协作</Text>
            </View>
          </View>
        </View>

        <View className='tips-card card'>
          <Text className='tips-title'>
            <AtIcon value='bell' size='16' color='#FF9800' /> 每日健康提示
          </Text>
          <Text className='tips-content'>
            保持规律作息，每天保证7-8小时睡眠，适量运动30分钟以上，有助于维持身心健康。
          </Text>
        </View>
      </View>
    )
  }
}
