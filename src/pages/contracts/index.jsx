import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { AtButton, AtCard, AtTag, AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui'
import { partnerApi } from '../../services'
import './index.scss'

const getToday = () => new Date().toISOString().slice(0, 10)
const getFutureDate = (days = 30) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default class Contracts extends Component {
  state = {
    loading: false,
    status: 'ALL',
    contracts: [],
    showCreate: false,
    title: '',
    content: '',
    targetValue: '',
    rewardPoints: '10'
  }

  componentDidShow() {
    this.loadContracts()
  }

  loadContracts = async () => {
    this.setState({ loading: true })
    try {
      const { status } = this.state
      const res = await partnerApi.listContracts(status === 'ALL' ? undefined : status)
      this.setState({ contracts: res?.data || [] })
    } catch (err) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' })
    } finally {
      this.setState({ loading: false })
    }
  }

  handleCreate = async () => {
    const { title, content, targetValue, rewardPoints } = this.state
    if (!title.trim()) {
      Taro.showToast({ title: '请输入契约标题', icon: 'none' })
      return
    }

    try {
      await partnerApi.createContract({
        title: title.trim(),
        content: content.trim(),
        contractType: 'CUSTOM',
        targetValue: targetValue.trim() || '每天打卡',
        period: 'DAILY',
        startDate: getToday(),
        endDate: getFutureDate(30),
        rewardPoints: Number(rewardPoints) || 10
      })

      Taro.showToast({ title: '创建成功', icon: 'success' })
      this.setState({
        showCreate: false,
        title: '',
        content: '',
        targetValue: '',
        rewardPoints: '10'
      })
      this.loadContracts()
    } catch (err) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' })
    }
  }

  handleComplete = async (contractId) => {
    try {
      await partnerApi.completeContract(contractId, { note: '完成契约打卡' })
      Taro.showToast({ title: '已提交完成', icon: 'success' })
      this.loadContracts()
    } catch (err) {
      Taro.showToast({ title: err.message || '提交失败', icon: 'none' })
    }
  }

  handleCancel = async (contractId) => {
    try {
      await partnerApi.cancelContract(contractId)
      Taro.showToast({ title: '已取消', icon: 'success' })
      this.loadContracts()
    } catch (err) {
      Taro.showToast({ title: err.message || '取消失败', icon: 'none' })
    }
  }

  renderContractItem = (contract) => {
    const isActive = contract.status === 'ACTIVE'

    return (
      <AtCard key={contract.id} className='contract-card' title={contract.title || '未命名契约'}>
        <View className='contract-meta'>
          <AtTag size='small' type={isActive ? 'primary' : 'default'}>
            {contract.status || 'UNKNOWN'}
          </AtTag>
          <Text className='meta-text'>奖励 {contract.rewardPoints || 0} 分</Text>
        </View>

        <Text className='contract-content'>{contract.content || '无描述'}</Text>
        <Text className='contract-content'>目标：{contract.targetValue || '-'}</Text>

        <View className='progress-wrap'>
          <View className='progress-bar'>
            <View className='progress-fill' style={{ width: `${contract.progress || 0}%` }} />
          </View>
          <Text className='progress-text'>{contract.progress || 0}%</Text>
        </View>

        <View className='actions'>
          {isActive && (
            <AtButton size='small' type='primary' onClick={() => this.handleComplete(contract.id)}>
              我已完成
            </AtButton>
          )}
          {isActive && (
            <AtButton size='small' onClick={() => this.handleCancel(contract.id)}>
              取消契约
            </AtButton>
          )}
        </View>
      </AtCard>
    )
  }

  render() {
    const { contracts, showCreate, title, content, targetValue, rewardPoints } = this.state

    return (
      <View className='contracts-page'>
        <View className='toolbar'>
          <AtButton type='primary' onClick={() => this.setState({ showCreate: true })}>创建契约</AtButton>
        </View>

        {contracts.length === 0 ? (
          <View className='empty'>
            <Text className='empty-text'>暂无契约，先创建一个吧</Text>
          </View>
        ) : (
          contracts.map(this.renderContractItem)
        )}

        <AtModal isOpened={showCreate} onClose={() => this.setState({ showCreate: false })}>
          <AtModalHeader>创建契约</AtModalHeader>
          <AtModalContent>
            <View className='form-item'>
              <Text className='label'>标题</Text>
              <Input className='input' value={title} onInput={(e) => this.setState({ title: e.detail.value })} placeholder='例如：连续30天双人打卡' />
            </View>
            <View className='form-item'>
              <Text className='label'>内容</Text>
              <Input className='input' value={content} onInput={(e) => this.setState({ content: e.detail.value })} placeholder='可填写具体规则' />
            </View>
            <View className='form-item'>
              <Text className='label'>目标</Text>
              <Input className='input' value={targetValue} onInput={(e) => this.setState({ targetValue: e.detail.value })} placeholder='例如：每天晚10点前打卡' />
            </View>
            <View className='form-item'>
              <Text className='label'>奖励积分</Text>
              <Input className='input' type='number' value={rewardPoints} onInput={(e) => this.setState({ rewardPoints: e.detail.value })} />
            </View>
          </AtModalContent>
          <AtModalAction>
            <AtButton onClick={() => this.setState({ showCreate: false })}>取消</AtButton>
            <AtButton type='primary' onClick={this.handleCreate}>创建</AtButton>
          </AtModalAction>
        </AtModal>
      </View>
    )
  }
}
