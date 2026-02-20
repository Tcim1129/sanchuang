import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtCard } from 'taro-ui'
import { partnerApi } from '../../services'
import { getMoodEmoji, formatDate } from '../../utils'
import './index.scss'

export default class PartnerCheckin extends Component {
  state = {
    loading: false,
    todayStatus: null,
    records: []
  }

  componentDidShow() {
    this.loadData()
  }

  loadData = async () => {
    this.setState({ loading: true })
    try {
      const [todayRes, historyRes] = await Promise.all([
        partnerApi.getPartnerCheckinStatus(),
        partnerApi.getPartnerCheckinHistory({ page: 1, size: 30 })
      ])

      this.setState({
        todayStatus: todayRes?.data || null,
        records: historyRes?.data || []
      })
    } catch (err) {
      console.error('load partner checkin failed', err)
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { todayStatus, records } = this.state

    return (
      <View className='partner-checkin-page'>
        <AtCard title='今日协作状态'>
          <View className='today-row'>
            <Text className='label'>我：</Text>
            <Text className='value'>{todayStatus?.meCompleted ? '已打卡' : '未打卡'}</Text>
          </View>
          <View className='today-row'>
            <Text className='label'>伴侣：</Text>
            <Text className='value'>{todayStatus?.partnerCompleted ? '已打卡' : '未打卡'}</Text>
          </View>
          <View className='today-row'>
            <Text className='label'>今日结果：</Text>
            <Text className='value'>{todayStatus?.bothCompleted ? '双方已完成' : '继续加油'}</Text>
          </View>
        </AtCard>

        <AtCard title='历史记录'>
          {records.length === 0 ? (
            <Text className='empty-text'>暂无历史记录</Text>
          ) : (
            <ScrollView scrollY className='history-list'>
              {records.map((item, idx) => (
                <View className='history-item' key={idx}>
                  <Text className='date'>{formatDate(item.date, 'MM-DD')}</Text>
                  <Text className='mood'>
                    我 {getMoodEmoji(item.myMoodScore || 5)} / 伴侣 {getMoodEmoji(item.partnerMoodScore || 5)}
                  </Text>
                  <Text className='result'>{item.bothCompleted ? '双方完成' : '未全部完成'}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </AtCard>
      </View>
    )
  }
}
