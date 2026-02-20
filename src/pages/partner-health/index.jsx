import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import { AtCard, AtProgress } from 'taro-ui'
import { partnerApi } from '../../services'
import './index.scss'

const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default class PartnerHealth extends Component {
  state = {
    data: {
      overallScore: 0,
      moodAlignment: 0,
      checkinConsistency: 0,
      communicationScore: 0,
      contractCompletion: 0,
      suggestion: ''
    }
  }

  componentDidShow() {
    this.loadData()
  }

  loadData = async () => {
    try {
      const res = await partnerApi.getRelationshipHealth()
      this.setState({
        data: {
          overallScore: toNumber(res?.data?.overallScore),
          moodAlignment: toNumber(res?.data?.moodAlignment),
          checkinConsistency: toNumber(res?.data?.checkinConsistency),
          communicationScore: toNumber(res?.data?.communicationScore),
          contractCompletion: toNumber(res?.data?.contractCompletion),
          suggestion: res?.data?.suggestion || '继续保持稳定沟通和协作打卡。'
        }
      })
    } catch (err) {
      console.error('load relationship health failed', err)
    }
  }

  renderMetric = (title, value, color = '#4CAF50') => (
    <View className='metric-item' key={title}>
      <View className='metric-head'>
        <Text className='metric-title'>{title}</Text>
        <Text className='metric-value'>{value}</Text>
      </View>
      <AtProgress percent={value} strokeWidth={10} color={color} isHidePercent />
    </View>
  )

  render() {
    const { data } = this.state

    return (
      <View className='partner-health-page'>
        <AtCard title='关系综合评分'>
          <View className='overall'>
            <Text className='score'>{data.overallScore}</Text>
            <Text className='unit'>分</Text>
          </View>
        </AtCard>

        <AtCard title='维度详情'>
          {this.renderMetric('心情同步', data.moodAlignment, '#42A5F5')}
          {this.renderMetric('打卡一致性', data.checkinConsistency, '#66BB6A')}
          {this.renderMetric('沟通质量', data.communicationScore, '#FFA726')}
          {this.renderMetric('契约完成度', data.contractCompletion, '#AB47BC')}
        </AtCard>

        <AtCard title='建议'>
          <Text className='suggestion'>{data.suggestion}</Text>
        </AtCard>
      </View>
    )
  }
}
