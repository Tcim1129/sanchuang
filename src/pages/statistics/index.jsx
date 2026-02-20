import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Canvas, ScrollView } from '@tarojs/components'
import { AtSegmentedControl, AtCard, AtList, AtListItem } from 'taro-ui'
import { healthApi } from '../../services'
import './index.scss'

const DAY_OPTIONS = [7, 30, 365]

const avg = (arr) => {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

const toNumber = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default class Statistics extends Component {
  state = {
    timeRange: 0,
    timeRanges: ['最近7天', '最近30天', '最近1年'],
    trendData: [],
    heatmapData: [],
    stats: {
      totalCheckins: 0,
      avgMood: 0,
      avgSleep: 0,
      streakDays: 0,
      bestDay: '',
      bestMood: 0
    },
    loading: false
  }

  componentDidMount() {
    this.loadData()
  }

  handleTimeRangeChange = (value) => {
    this.setState({ timeRange: value }, () => {
      this.loadData()
    })
  }

  loadData = async () => {
    this.setState({ loading: true })
    try {
      const { timeRange } = this.state
      const days = DAY_OPTIONS[timeRange] || 30

      const [trendRes, statsRes] = await Promise.all([
        healthApi.getTrend(days),
        healthApi.getStats()
      ])

      const trendData = Array.isArray(trendRes?.data) ? trendRes.data : []
      const statsData = statsRes?.data || {}

      this.setState({
        trendData,
        stats: {
          totalCheckins: toNumber(statsData.totalCheckins),
          avgMood: toNumber(statsData.avgMood),
          avgSleep: toNumber(statsData.avgSleep),
          streakDays: toNumber(statsData.streakDays),
          bestDay: statsData.bestDay || '',
          bestMood: toNumber(statsData.bestMood)
        }
      }, () => {
        this.drawTrendChart()
        this.drawRadarChart()
        this.generateHeatmapData()
      })
    } catch (err) {
      console.error('load statistics failed', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setState({ loading: false })
    }
  }

  generateHeatmapData = () => {
    const { trendData } = this.state
    const heatmap = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayData = trendData.find(d => d.date === dateStr)
      heatmap.push({
        date: dateStr,
        day: date.getDate(),
        month: date.getMonth() + 1,
        score: dayData ? toNumber(dayData.moodScore) : 0,
        hasData: !!dayData
      })
    }

    this.setState({ heatmapData: heatmap })
  }

  drawTrendChart = () => {
    const { trendData } = this.state
    const query = Taro.createSelectorQuery()
    query.select('#trendCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const width = res[0].width
        const height = res[0].height
        const padding = { top: 30, right: 20, bottom: 40, left: 40 }
        const chartWidth = width - padding.left - padding.right
        const chartHeight = height - padding.top - padding.bottom

        ctx.clearRect(0, 0, width, height)

        if (trendData.length === 0) {
          ctx.fillStyle = '#999'
          ctx.font = '14px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('暂无数据', width / 2, height / 2)
          return
        }

        ctx.strokeStyle = '#E0E0E0'
        ctx.lineWidth = 1

        ctx.beginPath()
        ctx.moveTo(padding.left, padding.top)
        ctx.lineTo(padding.left, height - padding.bottom)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(padding.left, height - padding.bottom)
        ctx.lineTo(width - padding.right, height - padding.bottom)
        ctx.stroke()

        ctx.fillStyle = '#999'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'right'
        for (let i = 0; i <= 10; i += 2) {
          const y = height - padding.bottom - (i / 10) * chartHeight
          ctx.fillText(i, padding.left - 10, y + 4)

          if (i > 0) {
            ctx.strokeStyle = '#F0F0F0'
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()
          }
        }

        const stepX = chartWidth / Math.max(1, trendData.length - 1)

        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
        gradient.addColorStop(0, 'rgba(67, 160, 71, 0.3)')
        gradient.addColorStop(1, 'rgba(67, 160, 71, 0.05)')

        ctx.beginPath()
        ctx.moveTo(padding.left, height - padding.bottom)
        trendData.forEach((item, index) => {
          const x = padding.left + index * stepX
          const y = height - padding.bottom - (toNumber(item.moodScore) / 10) * chartHeight
          ctx.lineTo(x, y)
        })
        ctx.lineTo(padding.left + Math.max(0, trendData.length - 1) * stepX, height - padding.bottom)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.beginPath()
        ctx.strokeStyle = '#43A047'
        ctx.lineWidth = 3
        trendData.forEach((item, index) => {
          const x = padding.left + index * stepX
          const y = height - padding.bottom - (toNumber(item.moodScore) / 10) * chartHeight
          if (index === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        trendData.forEach((item, index) => {
          const x = padding.left + index * stepX
          const y = height - padding.bottom - (toNumber(item.moodScore) / 10) * chartHeight

          ctx.beginPath()
          ctx.fillStyle = '#FFFFFF'
          ctx.strokeStyle = '#43A047'
          ctx.lineWidth = 2
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          ctx.fillStyle = '#43A047'
          ctx.font = 'bold 11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(toNumber(item.moodScore), x, y - 10)
        })

        ctx.fillStyle = '#999'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        const labelStep = Math.ceil(trendData.length / 6)
        trendData.forEach((item, index) => {
          if (index % labelStep === 0 || index === trendData.length - 1) {
            const x = padding.left + index * stepX
            const date = (item.date || '').substring(5)
            ctx.fillText(date, x, height - padding.bottom + 20)
          }
        })
      })
  }

  drawRadarChart = () => {
    const { trendData } = this.state
    const query = Taro.createSelectorQuery()
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const width = res[0].width
        const height = res[0].height
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 2 - 40

        ctx.clearRect(0, 0, width, height)

        const dimensions = [
          { name: '心情', key: 'moodScore', fallback: 5 },
          { name: '睡眠', key: 'sleepScore', fallback: 6 },
          { name: '运动', key: 'exerciseScore', fallback: 5 },
          { name: '饮食', key: 'dietScore', fallback: 5 },
          { name: '关系', key: 'relationshipScore', fallback: 5 },
          { name: '沟通', key: 'communicationScore', fallback: 5 }
        ]

        const avgData = {}
        dimensions.forEach(dim => {
          const values = trendData
            .map(d => toNumber(d[dim.key], 0))
            .filter(s => s > 0)
          avgData[dim.key] = values.length > 0 ? Math.round(avg(values)) : dim.fallback
        })

        ctx.strokeStyle = '#E8F5E9'
        ctx.lineWidth = 1
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath()
          const r = (radius / 5) * i
          for (let j = 0; j < dimensions.length; j++) {
            const angle = (Math.PI * 2 / dimensions.length) * j - Math.PI / 2
            const x = centerX + r * Math.cos(angle)
            const y = centerY + r * Math.sin(angle)
            if (j === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.stroke()
        }

        ctx.strokeStyle = '#C8E6C9'
        dimensions.forEach((dim, index) => {
          const angle = (Math.PI * 2 / dimensions.length) * index - Math.PI / 2
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
          ctx.stroke()

          const labelX = centerX + (radius + 20) * Math.cos(angle)
          const labelY = centerY + (radius + 20) * Math.sin(angle)
          ctx.fillStyle = '#666'
          ctx.font = 'bold 13px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(dim.name, labelX, labelY)
        })

        ctx.beginPath()
        ctx.fillStyle = 'rgba(67, 160, 71, 0.25)'
        ctx.strokeStyle = '#43A047'
        ctx.lineWidth = 2

        dimensions.forEach((dim, index) => {
          const angle = (Math.PI * 2 / dimensions.length) * index - Math.PI / 2
          const value = avgData[dim.key] || dim.fallback
          const r = (value / 10) * radius
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)

          if (index === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      })
  }

  getHeatmapColor = (score) => {
    if (score === 0) return '#ECEFF1'
    if (score >= 9) return '#2E7D32'
    if (score >= 7) return '#4CAF50'
    if (score >= 5) return '#8BC34A'
    if (score >= 3) return '#FFC107'
    return '#FF5722'
  }

  render() {
    const { timeRange, timeRanges, heatmapData, stats } = this.state

    return (
      <View className='statistics-page'>
        <View className='time-selector'>
          <AtSegmentedControl
            values={timeRanges}
            selectedColor='#43A047'
            current={timeRange}
            onClick={this.handleTimeRangeChange}
          />
        </View>

        <View className='stats-grid'>
          <View className='stat-card'>
            <Text className='stat-value' style={{ color: '#43A047' }}>{stats.totalCheckins}</Text>
            <Text className='stat-label'>打卡次数</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-value' style={{ color: '#FF9800' }}>{toNumber(stats.avgMood).toFixed(1)}</Text>
            <Text className='stat-label'>平均心情</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-value' style={{ color: '#2196F3' }}>{stats.streakDays}</Text>
            <Text className='stat-label'>连续天数</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-value' style={{ color: '#9C27B0' }}>{toNumber(stats.avgSleep).toFixed(1)}</Text>
            <Text className='stat-label'>平均睡眠</Text>
          </View>
        </View>

        <ScrollView scrollY className='charts-container' enableBackToTop>
          <AtCard title='心情趋势' className='chart-card'>
            <Canvas
              type='2d'
              id='trendCanvas'
              className='trend-canvas'
              style={{ width: '100%', height: '280px' }}
            />
          </AtCard>

          <AtCard title='健康维度分析' className='chart-card'>
            <Canvas
              type='2d'
              id='radarCanvas'
              className='radar-canvas'
              style={{ width: '100%', height: '300px' }}
            />
          </AtCard>

          <AtCard title='打卡热力图（最近30天）' className='chart-card'>
            <View className='heatmap-legend'>
              <Text className='legend-text'>低</Text>
              {['#FF5722', '#FFC107', '#8BC34A', '#4CAF50', '#2E7D32'].map((color, idx) => (
                <View key={idx} className='legend-dot' style={{ backgroundColor: color }} />
              ))}
              <Text className='legend-text'>高</Text>
            </View>
            <View className='heatmap-grid'>
              {heatmapData.map((item, index) => (
                <View
                  key={index}
                  className='heatmap-cell'
                  style={{
                    backgroundColor: this.getHeatmapColor(item.score),
                    opacity: item.hasData ? 1 : 0.3
                  }}
                >
                  <Text className='heatmap-day'>{item.day}</Text>
                  {item.score > 0 && (
                    <Text className='heatmap-score'>{item.score}</Text>
                  )}
                </View>
              ))}
            </View>
          </AtCard>

          <AtCard title='详细数据' className='chart-card'>
            <AtList>
              <AtListItem
                title='最佳状态'
                extraText={`${stats.bestDay || '-'} (心情 ${stats.bestMood || 0})`}
              />
              <AtListItem
                title='累计打卡'
                extraText={`${stats.totalCheckins} 天`}
              />
              <AtListItem
                title='平均睡眠'
                extraText={`${toNumber(stats.avgSleep).toFixed(1)} 小时`}
              />
              <AtListItem
                title='连续打卡'
                extraText={`${stats.streakDays} 天`}
              />
            </AtList>
          </AtCard>

          <View style={{ height: '40px' }} />
        </ScrollView>
      </View>
    )
  }
}
