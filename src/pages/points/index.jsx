import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtCard, AtTag } from 'taro-ui'
import { partnerApi } from '../../services'
import { formatDate } from '../../utils'
import './index.scss'

export default class Points extends Component {
  state = {
    points: {
      totalPoints: 0,
      availablePoints: 0,
      usedPoints: 0,
      rank: 0
    },
    records: []
  }

  componentDidShow() {
    this.loadData()
  }

  loadData = async () => {
    try {
      const [pointsRes, recordsRes] = await Promise.all([
        partnerApi.getPoints(),
        partnerApi.listPointsRecords({ page: 1, size: 50 })
      ])

      this.setState({
        points: pointsRes?.data || this.state.points,
        records: recordsRes?.data || []
      })
    } catch (err) {
      console.error('load points failed', err)
    }
  }

  render() {
    const { points, records } = this.state

    return (
      <View className='points-page'>
        <AtCard title='积分总览'>
          <View className='overview-grid'>
            <View className='item'>
              <Text className='num'>{points.totalPoints || 0}</Text>
              <Text className='label'>累计积分</Text>
            </View>
            <View className='item'>
              <Text className='num'>{points.availablePoints || 0}</Text>
              <Text className='label'>可用积分</Text>
            </View>
            <View className='item'>
              <Text className='num'>{points.usedPoints || 0}</Text>
              <Text className='label'>已用积分</Text>
            </View>
            <View className='item'>
              <Text className='num'>{points.rank || '-'}</Text>
              <Text className='label'>排名</Text>
            </View>
          </View>
        </AtCard>

        <AtCard title='积分记录'>
          {records.length === 0 ? (
            <Text className='empty-text'>暂无积分记录</Text>
          ) : (
            <ScrollView scrollY className='record-list'>
              {records.map((item, idx) => (
                <View className='record-item' key={item.id || idx}>
                  <View className='left'>
                    <Text className='desc'>{item.description || '积分变动'}</Text>
                    <Text className='time'>{formatDate(item.createTime, 'YYYY-MM-DD HH:mm')}</Text>
                  </View>
                  <View className='right'>
                    <AtTag type='primary' size='small'>+{item.points || 0}</AtTag>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </AtCard>
      </View>
    )
  }
}
