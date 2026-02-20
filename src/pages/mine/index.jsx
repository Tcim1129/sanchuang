import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtIcon, AtList, AtListItem, AtModal } from 'taro-ui'
import { userApi, healthApi } from '../../services'
import { getLocalUserInfo, clearLoginInfo, getMoodEmoji, formatDate } from '../../utils'
import './index.scss'

export default class Mine extends Component {
  state = {
    userInfo: {},
    streakDays: 0,
    totalCheckins: 0,
    checkinHistory: [],
    historyPage: 1,
    hasMore: true,
    loadingMore: false,
    showLogoutModal: false
  }

  componentDidShow() {
    this.loadUserData()
    this.loadCheckinHistory(1, true)
  }

  onPullDownRefresh() {
    Promise.all([
      this.loadUserData(),
      this.loadCheckinHistory(1, true)
    ]).then(() => {
      Taro.stopPullDownRefresh()
    })
  }

  loadUserData = async () => {
    try {
      const localUser = getLocalUserInfo()
      this.setState({ userInfo: localUser })

      const [userRes, streakRes] = await Promise.allSettled([
        userApi.getUserInfo(),
        healthApi.getStreakDays()
      ])

      if (userRes.status === 'fulfilled' && userRes.value?.data) {
        this.setState({ userInfo: userRes.value.data })
        Taro.setStorageSync('userInfo', JSON.stringify(userRes.value.data))
      }

      if (streakRes.status === 'fulfilled') {
        this.setState({
          streakDays: streakRes.value?.data?.days || 0,
          totalCheckins: streakRes.value?.data?.total || 0
        })
      }
    } catch (err) {
      console.error('load mine user data failed', err)
    }
  }

  loadCheckinHistory = async (page = 1, reset = false) => {
    if (this.state.loadingMore) return

    this.setState({ loadingMore: true })

    try {
      const res = await healthApi.getCheckinHistory({ page, size: 10 })
      const records = res.data?.records || []

      this.setState(prev => ({
        checkinHistory: reset ? records : [...prev.checkinHistory, ...records],
        historyPage: page,
        hasMore: records.length >= 10,
        loadingMore: false
      }))
    } catch (err) {
      console.error('load checkin history failed', err)
      this.setState({ loadingMore: false })
    }
  }

  handleLoadMore = () => {
    const { hasMore, historyPage } = this.state
    if (hasMore) {
      this.loadCheckinHistory(historyPage + 1)
    }
  }

  handleLogout = () => {
    this.setState({ showLogoutModal: true })
  }

  confirmLogout = async () => {
    try {
      await userApi.logout()
    } catch (err) {
      // clear local session anyway
    }

    clearLoginInfo()
    this.setState({ showLogoutModal: false })
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  cancelLogout = () => {
    this.setState({ showLogoutModal: false })
  }

  navigateToAbout = () => {
    Taro.showModal({
      title: '关于亲健',
      content: '亲健 v1.0.0\n\n青年亲密关系健康管理平台。',
      showCancel: false
    })
  }

  navigateToFeedback = () => {
    Taro.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请联系：\nfeedback@qinji.com',
      showCancel: false
    })
  }

  render() {
    const { userInfo, streakDays, totalCheckins, checkinHistory, hasMore, loadingMore, showLogoutModal } = this.state

    return (
      <View className='mine-page'>
        <View className='user-card'>
          <View className='user-avatar'>
            <AtIcon value='user' size='40' color='#FFFFFF' />
          </View>
          <View className='user-info'>
            <Text className='user-name'>{userInfo.nickname || '亲健用户'}</Text>
            <Text className='user-id'>ID: {userInfo.id || '--'}</Text>
          </View>
        </View>

        <View className='stats-card card'>
          <View className='stat-item'>
            <Text className='stat-number'>{streakDays}</Text>
            <Text className='stat-label'>连续打卡</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-number'>{totalCheckins}</Text>
            <Text className='stat-label'>累计打卡</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-number'>
              {checkinHistory.length > 0 ? checkinHistory[0].moodScore || '--' : '--'}
            </Text>
            <Text className='stat-label'>最近心情</Text>
          </View>
        </View>

        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>打卡记录</Text>
          </View>

          {checkinHistory.length > 0 ? (
            <ScrollView
              className='history-list'
              scrollY
              onScrollToLower={this.handleLoadMore}
            >
              {checkinHistory.map((record, index) => (
                <View key={record.id || index} className='history-item card'>
                  <View className='history-header'>
                    <Text className='history-date'>
                      {formatDate(record.checkinDate || record.createTime, 'MM-DD')}
                    </Text>
                    <Text className='history-mood'>
                      {getMoodEmoji(record.moodScore)} {record.moodScore}/10
                    </Text>
                  </View>
                  <View className='history-body'>
                    <View className='history-tag'>
                      <AtIcon value='clock' size='14' color='#666' />
                      <Text className='tag-text'>睡 {record.sleepHours || 0}h</Text>
                    </View>
                    <View className='history-tag'>
                      <AtIcon value='lightning-bolt' size='14' color='#666' />
                      <Text className='tag-text'>动 {record.exerciseMinutes || 0}min</Text>
                    </View>
                    <View className='history-tag'>
                      <AtIcon value='star' size='14' color='#666' />
                      <Text className='tag-text'>饮 {record.dietQuality || 0}/5</Text>
                    </View>
                  </View>
                  {record.remark && (
                    <Text className='history-remark'>{record.remark}</Text>
                  )}
                </View>
              ))}

              {loadingMore && (
                <View className='loading-more'>
                  <Text className='loading-text'>加载中...</Text>
                </View>
              )}

              {!hasMore && checkinHistory.length > 0 && (
                <View className='no-more'>
                  <Text className='no-more-text'>- 没有更多了 -</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <View className='empty-state card'>
              <Text className='empty-icon'>📝</Text>
              <Text className='empty-text'>还没有打卡记录</Text>
              <Text className='empty-sub'>快去打卡吧</Text>
            </View>
          )}
        </View>

        <View className='section settings-section'>
          <AtList hasBorder={false}>
            <AtListItem
              title='关于亲健'
              arrow='right'
              iconInfo={{ size: 22, color: '#4CAF50', value: 'help' }}
              onClick={this.navigateToAbout}
            />
            <AtListItem
              title='意见反馈'
              arrow='right'
              iconInfo={{ size: 22, color: '#FF9800', value: 'message' }}
              onClick={this.navigateToFeedback}
            />
            <AtListItem
              title='退出登录'
              arrow='right'
              iconInfo={{ size: 22, color: '#F44336', value: 'blocked' }}
              onClick={this.handleLogout}
            />
          </AtList>
        </View>

        <AtModal
          isOpened={showLogoutModal}
          title='提示'
          cancelText='取消'
          confirmText='确认退出'
          content='确定要退出登录吗？'
          onClose={this.cancelLogout}
          onCancel={this.cancelLogout}
          onConfirm={this.confirmLogout}
        />

        <View className='footer'>
          <Text className='version'>亲健 v1.0.0</Text>
        </View>
      </View>
    )
  }
}
