import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtButton, AtInput, AtIcon, AtToast } from 'taro-ui'
import { userApi } from '../../services'
import { saveLoginInfo, isValidPhone } from '../../utils'
import './index.scss'

export default class Login extends Component {

  state = {
    // 登录模式：'wechat' | 'phone'
    loginMode: 'wechat',
    // 手机号登录
    phone: '',
    smsCode: '',
    smsCountdown: 0,
    // 用户协议
    agreed: false,
    // 加载状态
    loading: false,
    // 提示
    toastOpen: false,
    toastText: ''
  }

  smsTimer = null

  componentWillUnmount() {
    if (this.smsTimer) clearInterval(this.smsTimer)
  }

  // ==================== 微信登录 ====================

  handleWechatLogin = async () => {
    if (!this.state.agreed) {
      this.showToast('请先阅读并同意用户协议')
      return
    }

    this.setState({ loading: true })

    try {
      // 1. 调用微信登录获取 code
      const loginRes = await Taro.login()

      if (!loginRes.code) {
        this.showToast('微信登录失败，请重试')
        return
      }

      // 2. 将 code 发送到后端换取 token
      const res = await userApi.wxLogin({ code: loginRes.code })

      // 3. 保存登录信息
      saveLoginInfo(res.data.token, res.data.userInfo)

      // 4. 跳转首页
      Taro.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)

    } catch (err) {
      console.error('微信登录失败：', err)
      this.showToast(err.message || '登录失败，请重试')
    } finally {
      this.setState({ loading: false })
    }
  }

  // ==================== 手机号登录 ====================

  handlePhoneChange = (value) => {
    // 去除 AtInput type='phone' 自动插入的空格，避免真机光标跳转
    this.setState({ phone: value.replace(/\s/g, '') })
  }

  handleSmsCodeChange = (value) => {
    this.setState({ smsCode: value })
  }

  handleSendSms = async () => {
    const { phone, smsCountdown } = this.state

    if (smsCountdown > 0) return

    if (!isValidPhone(phone)) {
      this.showToast('请输入正确的手机号')
      return
    }

    try {
      await userApi.sendSmsCode(phone)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })

      // 开始倒计时
      this.setState({ smsCountdown: 60 })
      this.smsTimer = setInterval(() => {
        this.setState(prev => {
          if (prev.smsCountdown <= 1) {
            clearInterval(this.smsTimer)
            return { smsCountdown: 0 }
          }
          return { smsCountdown: prev.smsCountdown - 1 }
        })
      }, 1000)

    } catch (err) {
      this.showToast(err.message || '发送失败')
    }
  }

  handlePhoneLogin = async () => {
    const { phone, smsCode, agreed } = this.state

    if (!agreed) {
      this.showToast('请先阅读并同意用户协议')
      return
    }

    if (!isValidPhone(phone)) {
      this.showToast('请输入正确的手机号')
      return
    }

    if (!smsCode || smsCode.length < 4) {
      this.showToast('请输入验证码')
      return
    }

    this.setState({ loading: true })

    try {
      const res = await userApi.phoneLogin({ phone, code: smsCode })

      saveLoginInfo(res.data.token, res.data.userInfo)

      Taro.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)

    } catch (err) {
      this.showToast(err.message || '登录失败')
    } finally {
      this.setState({ loading: false })
    }
  }

  // ==================== 通用 ====================

  toggleLoginMode = () => {
    this.setState(prev => ({
      loginMode: prev.loginMode === 'wechat' ? 'phone' : 'wechat'
    }))
  }

  toggleAgreement = () => {
    this.setState(prev => ({ agreed: !prev.agreed }))
  }

  showToast = (text) => {
    this.setState({ toastOpen: true, toastText: text })
    setTimeout(() => this.setState({ toastOpen: false }), 2000)
  }

  openAgreement = (e) => {
    // 阻止事件冒泡，避免触发父元素的 toggleAgreement
    e.stopPropagation()
    // 可跳转到协议页面
    Taro.showModal({
      title: '用户协议',
      content: '欢迎使用亲健健康管理平台。我们将保护您的隐私和数据安全，请放心使用。详细协议内容请查阅官网。',
      showCancel: false
    })
  }

  openPrivacy = (e) => {
    // 阻止事件冒泡，避免触发父元素的 toggleAgreement
    e.stopPropagation()
    Taro.showModal({
      title: '隐私政策',
      content: '亲健严格保护用户个人隐私，所有健康数据均加密存储，不会向第三方透露。详细政策请查阅官网。',
      showCancel: false
    })
  }

  render() {
    const { loginMode, phone, smsCode, smsCountdown, agreed, loading, toastOpen, toastText } = this.state

    return (
      <View className='login-page'>
        {/* 顶部 Logo 区域 */}
        <View className='login-header'>
          <View className='logo-wrapper'>
            <View className='logo-icon'>
              <Text className='logo-text-icon'>亲</Text>
            </View>
          </View>
          <Text className='app-name'>亲健</Text>
          <Text className='app-slogan'>让健康管理有温度</Text>
        </View>

        {/* 登录表单区域 */}
        <View className='login-body'>
          {loginMode === 'wechat' ? (
            /* 微信一键登录 */
            <View className='wechat-login-section'>
              <AtButton
                type='primary'
                className='wechat-login-btn'
                loading={loading}
                disabled={loading}
                onClick={this.handleWechatLogin}
              >
                <AtIcon value='lightning-bolt' size='20' color='#fff' />
                <Text className='btn-text'>微信一键登录</Text>
              </AtButton>

              <View className='switch-mode' onClick={this.toggleLoginMode}>
                <Text className='switch-text'>使用手机号登录</Text>
              </View>
            </View>
          ) : (
            /* 手机号+验证码登录 */
            <View className='phone-login-section'>
              <View className='input-group'>
                <AtInput
                  name='phone'
                  title='手机号'
                  type='number'
                  maxLength={11}
                  placeholder='请输入手机号'
                  value={phone}
                  onChange={this.handlePhoneChange}
                />
              </View>

              <View className='input-group sms-group'>
                <View className='sms-input-wrapper'>
                  <AtInput
                    name='smsCode'
                    title='验证码'
                    type='number'
                    maxLength={6}
                    placeholder='请输入验证码'
                    value={smsCode}
                    onChange={this.handleSmsCodeChange}
                  />
                </View>
                <View
                  className={`sms-btn ${smsCountdown > 0 ? 'sms-btn-disabled' : ''}`}
                  onClick={this.handleSendSms}
                >
                  <Text className='sms-btn-text'>
                    {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                  </Text>
                </View>
              </View>

              <AtButton
                type='primary'
                className='phone-login-btn'
                loading={loading}
                disabled={loading}
                onClick={this.handlePhoneLogin}
              >
                登录
              </AtButton>

              <View className='switch-mode' onClick={this.toggleLoginMode}>
                <Text className='switch-text'>使用微信登录</Text>
              </View>
            </View>
          )}
        </View>

        {/* 底部用户协议 */}
        <View className='login-footer'>
          <View className='agreement-row' onClick={this.toggleAgreement}>
            <View className={`checkbox ${agreed ? 'checked' : ''}`}>
              {agreed && <AtIcon value='check' size='12' color='#fff' />}
            </View>
            <Text className='agreement-text'>
              我已阅读并同意
            </Text>
            <Text className='agreement-link' onClick={this.openAgreement}>《用户协议》</Text>
            <Text className='agreement-text'>和</Text>
            <Text className='agreement-link' onClick={this.openPrivacy}>《隐私政策》</Text>
          </View>
        </View>

        {/* Toast 提示 */}
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
