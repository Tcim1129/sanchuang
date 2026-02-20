import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import {
  AtButton,
  AtCard,
  AtTag,
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtModalAction,
  AtInput
} from 'taro-ui'
import { partnerApi } from '../../services'
import './index.scss'

export default class Partner extends Component {
  state = {
    loading: true,
    relationship: null,
    inviteCode: '',
    showBindModal: false,
    showInviteModal: false,
    inputCode: '',
    todayStatus: null,
    contracts: []
  }

  componentDidShow() {
    this.loadData()
  }

  loadData = async () => {
    this.setState({ loading: true })
    try {
      const [statusRes, todayRes, contractsRes] = await Promise.allSettled([
        partnerApi.getRelationshipStatus(),
        partnerApi.getPartnerCheckinStatus(),
        partnerApi.listContracts()
      ])

      this.setState({
        relationship: statusRes.status === 'fulfilled' ? (statusRes.value?.data || null) : null,
        todayStatus: todayRes.status === 'fulfilled' ? (todayRes.value?.data || null) : null,
        contracts: contractsRes.status === 'fulfilled' ? (contractsRes.value?.data || []) : []
      })
    } catch (err) {
      console.error('load partner data failed', err)
    } finally {
      this.setState({ loading: false })
    }
  }

  generateInviteCode = async () => {
    try {
      const res = await partnerApi.generateInviteCode()
      if (res?.data?.inviteCode) {
        this.setState({
          inviteCode: res.data.inviteCode,
          showInviteModal: true
        })
      }
    } catch (err) {
      Taro.showToast({ title: err.message || '生成失败', icon: 'none' })
    }
  }

  bindPartner = async () => {
    const { inputCode } = this.state
    if (!inputCode.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }

    try {
      await partnerApi.bindPartner(inputCode.trim())
      Taro.showToast({ title: '绑定成功', icon: 'success' })
      this.setState({ showBindModal: false, inputCode: '' })
      this.loadData()
    } catch (err) {
      Taro.showToast({ title: err.message || '绑定失败', icon: 'none' })
    }
  }

  copyInviteCode = () => {
    const { inviteCode } = this.state
    Taro.setClipboardData({
      data: inviteCode,
      success: () => {
        Taro.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  }

  navigateToContracts = () => {
    Taro.navigateTo({ url: '/pages/contracts/index' })
  }

  renderUnbound() {
    return (
      <View className='partner-unbound'>
        <View className='unbound-illustration'>
          <Text className='illustration-icon'>💞</Text>
          <Text className='illustration-title'>邀请你的伴侣</Text>
          <Text className='illustration-desc'>一起打卡，互相督促，共同进步</Text>
        </View>

        <View className='action-buttons'>
          <AtButton type='primary' className='action-btn primary' onClick={this.generateInviteCode}>
            生成邀请码
          </AtButton>

          <AtButton
            className='action-btn secondary'
            onClick={() => this.setState({ showBindModal: true })}
          >
            输入邀请码绑定
          </AtButton>
        </View>

        <View className='feature-intro'>
          <View className='feature-item'>
            <Text className='feature-icon'>👫</Text>
            <Text className='feature-text'>双人打卡，互相监督</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🎯</Text>
            <Text className='feature-text'>健康契约，共同目标</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🏅</Text>
            <Text className='feature-text'>积分奖励，持续激励</Text>
          </View>
        </View>
      </View>
    )
  }

  renderBound() {
    const { relationship, todayStatus, contracts } = this.state

    return (
      <View className='partner-bound'>
        <AtCard
          className='partner-card'
          title='我的伴侣'
          extra={
            <AtTag type='primary' size='small'>
              健康指数 {relationship?.healthScore || 50}
            </AtTag>
          }
        >
          <View className='partner-info'>
            <View className='partner-avatar'>
              <Text className='avatar-text'>{relationship?.partnerNickname?.[0] || '?'}</Text>
            </View>
            <View className='partner-detail'>
              <Text className='partner-name'>{relationship?.partnerNickname || '伴侣'}</Text>
              <Text className='partner-meta'>
                共同打卡 {relationship?.sharedCheckinDays || 0} 天
              </Text>
            </View>
          </View>
        </AtCard>

        <AtCard className='checkin-card' title='今日打卡'>
          <View className='checkin-status'>
            <View className='status-item'>
              <View className={`status-dot ${todayStatus?.meCompleted ? 'completed' : ''}`} />
              <Text className='status-label'>我</Text>
              <Text className='status-value'>{todayStatus?.meCompleted ? '已打卡' : '未打卡'}</Text>
            </View>
            <View className='status-item'>
              <View className={`status-dot ${todayStatus?.partnerCompleted ? 'completed' : ''}`} />
              <Text className='status-label'>伴侣</Text>
              <Text className='status-value'>{todayStatus?.partnerCompleted ? '已打卡' : '未打卡'}</Text>
            </View>
          </View>

          {todayStatus?.bothCompleted && (
            <View className='both-completed'>
              <Text className='completed-text'>🎉 今日双方都完成打卡</Text>
            </View>
          )}
        </AtCard>

        <AtCard
          className='contracts-card'
          title='健康契约'
          extra={<Text className='view-more' onClick={this.navigateToContracts}>查看更多 {'>'}</Text>}
        >
          {contracts.length === 0 ? (
            <View className='empty-contracts'>
              <Text className='empty-text'>暂无进行中的契约</Text>
              <AtButton type='secondary' size='small' onClick={this.navigateToContracts}>
                创建契约
              </AtButton>
            </View>
          ) : (
            <View className='contract-list'>
              {contracts.slice(0, 2).map(contract => (
                <View key={contract.id} className='contract-item'>
                  <View className='contract-header'>
                    <Text className='contract-title'>{contract.title}</Text>
                    <AtTag type={contract.status === 'ACTIVE' ? 'primary' : 'default'} size='small'>
                      {contract.status === 'ACTIVE' ? '进行中' : '已完成'}
                    </AtTag>
                  </View>
                  <View className='contract-progress'>
                    <View className='progress-bar'>
                      <View className='progress-fill' style={{ width: `${contract.progress || 0}%` }} />
                    </View>
                    <Text className='progress-text'>{contract.progress || 0}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AtCard>

        <View className='quick-actions'>
          <View className='action-grid'>
            <View className='action-item' onClick={() => Taro.navigateTo({ url: '/pages/partner-checkin/index' })}>
              <Text className='action-icon'>📅</Text>
              <Text className='action-label'>打卡记录</Text>
            </View>
            <View className='action-item' onClick={() => Taro.navigateTo({ url: '/pages/partner-health/index' })}>
              <Text className='action-icon'>💗</Text>
              <Text className='action-label'>关系健康</Text>
            </View>
            <View className='action-item' onClick={this.navigateToContracts}>
              <Text className='action-icon'>📜</Text>
              <Text className='action-label'>契约管理</Text>
            </View>
            <View className='action-item' onClick={() => Taro.navigateTo({ url: '/pages/points/index' })}>
              <Text className='action-icon'>🏅</Text>
              <Text className='action-label'>积分</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  render() {
    const { loading, relationship, showBindModal, showInviteModal, inputCode, inviteCode } = this.state

    if (loading) {
      return (
        <View className='partner-page loading'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )
    }

    return (
      <View className='partner-page'>
        {relationship?.hasPartner ? this.renderBound() : this.renderUnbound()}

        <AtModal isOpened={showBindModal} onClose={() => this.setState({ showBindModal: false })}>
          <AtModalHeader>输入邀请码</AtModalHeader>
          <AtModalContent>
            <AtInput
              name='inviteCode'
              type='text'
              placeholder='请输入伴侣的邀请码'
              value={inputCode}
              onChange={(value) => this.setState({ inputCode: value })}
            />
          </AtModalContent>
          <AtModalAction>
            <AtButton onClick={() => this.setState({ showBindModal: false })}>取消</AtButton>
            <AtButton type='primary' onClick={this.bindPartner}>确定</AtButton>
          </AtModalAction>
        </AtModal>

        <AtModal isOpened={showInviteModal} onClose={() => this.setState({ showInviteModal: false })}>
          <AtModalHeader>邀请码</AtModalHeader>
          <AtModalContent>
            <View className='invite-code-display'>
              <Text className='code-text'>{inviteCode}</Text>
              <Text className='code-hint'>请将此码发送给伴侣（24小时内有效）</Text>
            </View>
          </AtModalContent>
          <AtModalAction>
            <AtButton onClick={() => this.setState({ showInviteModal: false })}>关闭</AtButton>
            <AtButton type='primary' onClick={this.copyInviteCode}>复制</AtButton>
          </AtModalAction>
        </AtModal>
      </View>
    )
  }
}
