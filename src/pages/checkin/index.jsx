import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea, Slider } from '@tarojs/components'
import { AtButton, AtIcon, AtToast, AtRate } from 'taro-ui'
import { healthApi } from '../../services'
import { getMoodEmoji, getMoodText } from '../../utils'
import './index.scss'

// 情绪类型选项
const EMOTION_TYPES = [
  { value: 'HAPPY', label: '开心', emoji: '😊' },
  { value: 'CALM', label: '平静', emoji: '😌' },
  { value: 'ANXIOUS', label: '焦虑', emoji: '😰' },
  { value: 'DEPRESSED', label: '抑郁', emoji: '😔' },
  { value: 'ANGRY', label: '愤怒', emoji: '😡' }
]

export default class Checkin extends Component {

  state = {
    // 表单数据
    moodScore: 5,
    relationshipScore: 5,
    communicationScore: 5,
    sleepHours: 7,
    exerciseMinutes: 30,
    dietQuality: 3,
    emotionType: '',
    remark: '',
    // 状态
    submitting: false,
    showSuccess: false,
    // 提示
    toastOpen: false,
    toastText: ''
  }

  // ==================== 表单处理 ====================

  handleMoodChange = (score) => {
    this.setState({ moodScore: score })
  }

  handleRelationshipChange = (score) => {
    this.setState({ relationshipScore: score })
  }

  handleCommunicationChange = (score) => {
    this.setState({ communicationScore: score })
  }

  handleSleepChange = (e) => {
    this.setState({ sleepHours: e.detail.value })
  }

  handleExerciseChange = (e) => {
    this.setState({ exerciseMinutes: e.detail.value })
  }

  handleDietChange = (value) => {
    this.setState({ dietQuality: value })
  }

  handleEmotionSelect = (type) => {
    this.setState({ emotionType: type })
  }

  handleRemarkInput = (e) => {
    this.setState({ remark: e.detail.value })
  }

  // ==================== 表单验证 ====================

  validate = () => {
    const { moodScore } = this.state

    if (!moodScore || moodScore < 1 || moodScore > 10) {
      this.showToast('请选择今日心情评分')
      return false
    }

    return true
  }

  // ==================== 提交 ====================

  handleSubmit = async () => {
    if (!this.validate()) return

    const { moodScore, relationshipScore, communicationScore, sleepHours, exerciseMinutes, dietQuality, emotionType, remark } = this.state

    this.setState({ submitting: true })

    try {
      await healthApi.submitCheckin({
        checkinDate: new Date().toISOString().slice(0, 10),
        moodScore,
        relationshipScore,
        communicationScore,
        sleepHours,
        exerciseMinutes,
        dietScore: dietQuality,
        emotionType: emotionType || undefined,
        diary: remark || undefined
      })

      // 显示成功动画
      this.setState({ showSuccess: true })

      setTimeout(() => {
        this.setState({ showSuccess: false })
        Taro.showToast({ title: '打卡成功！', icon: 'success', duration: 1500 })
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
      }, 2000)

    } catch (err) {
      this.showToast(err.message || '打卡失败，请重试')
    } finally {
      this.setState({ submitting: false })
    }
  }

  showToast = (text) => {
    this.setState({ toastOpen: true, toastText: text })
    setTimeout(() => this.setState({ toastOpen: false }), 2000)
  }

  // ==================== 渲染 ====================

  render() {
    const {
      moodScore, relationshipScore, communicationScore, sleepHours, exerciseMinutes, dietQuality,
      emotionType, remark, submitting, showSuccess,
      toastOpen, toastText
    } = this.state

    return (
      <View className='checkin-page'>
        {/* 成功动画遮罩 */}
        {showSuccess && (
          <View className='success-overlay'>
            <View className='success-animation'>
              <View className='success-icon'>
                <AtIcon value='check-circle' size='80' color='#4CAF50' />
              </View>
              <Text className='success-text'>打卡成功！</Text>
              <Text className='success-sub'>今天又进步了一点</Text>
            </View>
          </View>
        )}

        {/* 心情评分 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>今日心情</Text>
            <Text className='card-required'>*必填</Text>
          </View>
          <View className='mood-section'>
            <View className='mood-display'>
              <Text className='mood-emoji'>{getMoodEmoji(moodScore)}</Text>
              <Text className='mood-score'>{moodScore}/10</Text>
              <Text className='mood-text'>{getMoodText(moodScore)}</Text>
            </View>
            <View className='mood-selector'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <View
                  key={score}
                  className={`mood-dot ${moodScore === score ? 'active' : ''} ${moodScore >= score ? 'filled' : ''}`}
                  onClick={() => this.handleMoodChange(score)}
                >
                  <Text className='mood-dot-text'>{score}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 亲密关系评分 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>
              <Text className='card-icon'>💑</Text> 亲密关系满意度
            </Text>
            <Text className='card-value'>{relationshipScore}/10</Text>
          </View>
          <View className='relationship-section'>
            <View className='mood-selector'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <View
                  key={score}
                  className={`mood-dot ${relationshipScore === score ? 'active' : ''} ${relationshipScore >= score ? 'filled relationship-filled' : ''}`}
                  onClick={() => this.handleRelationshipChange(score)}
                >
                  <Text className='mood-dot-text'>{score}</Text>
                </View>
              ))}
            </View>
            <View className='relationship-desc'>
              <Text className='relationship-label'>冷淡</Text>
              <Text className='relationship-label'>甜蜜</Text>
            </View>
          </View>
        </View>

        {/* 沟通评分 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>
              <Text className='card-icon'>💬</Text> 沟通质量
            </Text>
            <Text className='card-value'>{communicationScore}/10</Text>
          </View>
          <View className='communication-section'>
            <View className='mood-selector'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <View
                  key={score}
                  className={`mood-dot ${communicationScore === score ? 'active' : ''} ${communicationScore >= score ? 'filled communication-filled' : ''}`}
                  onClick={() => this.handleCommunicationChange(score)}
                >
                  <Text className='mood-dot-text'>{score}</Text>
                </View>
              ))}
            </View>
            <View className='communication-desc'>
              <Text className='communication-label'>回避</Text>
              <Text className='communication-label'>畅聊</Text>
            </View>
          </View>
        </View>

        {/* 睡眠时长 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>
              <Text className='card-icon'>😴</Text> 睡眠时长
            </Text>
            <Text className='card-value'>{sleepHours} 小时</Text>
          </View>
          <Slider
            min={0}
            max={12}
            step={0.5}
            value={sleepHours}
            activeColor='#4CAF50'
            backgroundColor='#E0E0E0'
            blockSize={24}
            blockColor='#4CAF50'
            onChange={this.handleSleepChange}
          />
          <View className='slider-labels'>
            <Text className='slider-label'>0h</Text>
            <Text className='slider-label'>6h</Text>
            <Text className='slider-label'>12h</Text>
          </View>
        </View>

        {/* 运动时长 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>
              <Text className='card-icon'>🏃</Text> 运动时长
            </Text>
            <Text className='card-value'>{exerciseMinutes} 分钟</Text>
          </View>
          <Slider
            min={0}
            max={180}
            step={5}
            value={exerciseMinutes}
            activeColor='#FF9800'
            backgroundColor='#E0E0E0'
            blockSize={24}
            blockColor='#FF9800'
            onChange={this.handleExerciseChange}
          />
          <View className='slider-labels'>
            <Text className='slider-label'>0min</Text>
            <Text className='slider-label'>90min</Text>
            <Text className='slider-label'>180min</Text>
          </View>
        </View>

        {/* 饮食质量 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>
              <Text className='card-icon'>🥗</Text> 饮食质量
            </Text>
          </View>
          <View className='diet-rating'>
            <AtRate
              value={dietQuality}
              max={5}
              size={36}
              onChange={this.handleDietChange}
            />
            <Text className='diet-text'>
              {['', '很差', '较差', '一般', '良好', '优秀'][dietQuality]}
            </Text>
          </View>
        </View>

        {/* 情绪类型 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>情绪类型</Text>
          </View>
          <View className='emotion-grid'>
            {EMOTION_TYPES.map(item => (
              <View
                key={item.value}
                className={`emotion-item ${emotionType === item.value ? 'active' : ''}`}
                onClick={() => this.handleEmotionSelect(item.value)}
              >
                <Text className='emotion-emoji'>{item.emoji}</Text>
                <Text className='emotion-label'>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 备注 */}
        <View className='card checkin-card'>
          <View className='card-header'>
            <Text className='card-title'>
              <Text className='card-icon'>📝</Text> 备注
            </Text>
          </View>
          <Textarea
            className='remark-input'
            placeholder='记录一下今天的感受吧...'
            maxlength={500}
            value={remark}
            onInput={this.handleRemarkInput}
          />
          <Text className='remark-count'>{remark.length}/500</Text>
        </View>

        {/* 提交按钮 */}
        <View className='submit-section'>
          <AtButton
            type='primary'
            className='submit-btn'
            loading={submitting}
            disabled={submitting}
            onClick={this.handleSubmit}
          >
            {submitting ? '提交中...' : '完成打卡'}
          </AtButton>
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
