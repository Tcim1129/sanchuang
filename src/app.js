import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

class App extends Component {

  componentDidMount() {
    // 检查登录状态
    // 注意：在 App 层面不做跳转，改为在各页面的 componentDidShow 中检查
    // 这样可以避免 App 初始化时页面栈未就绪的问题
  }

  componentDidShow() {
    // 检查登录状态，如果未登录则跳转到登录页
    const token = Taro.getStorageSync('token')
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentRoute = currentPage?.route || ''

    // 如果当前不在登录页且未登录，则跳转登录页
    if (!token && !currentRoute.includes('login')) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }

  componentDidHide() { }

  // this.props.children 是将要会渲染的页面
  render() {
    return this.props.children
  }
}

export default App
