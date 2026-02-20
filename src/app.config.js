export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/checkin/index',
    'pages/aichat/index',
    'pages/mine/index',
    'pages/statistics/index',
    'pages/partner/index',
    'pages/contracts/index',
    'pages/partner-checkin/index',
    'pages/partner-health/index',
    'pages/points/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4CAF50',
    navigationBarTitleText: '亲健',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F5F5'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#4CAF50',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/images/tab-home.png',
        selectedIconPath: 'assets/images/tab-home-active.png'
      },
      {
        pagePath: 'pages/checkin/index',
        text: '打卡',
        iconPath: 'assets/images/tab-checkin.png',
        selectedIconPath: 'assets/images/tab-checkin-active.png'
      },
      {
        pagePath: 'pages/aichat/index',
        text: 'AI咨询',
        iconPath: 'assets/images/tab-ai.png',
        selectedIconPath: 'assets/images/tab-ai-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/images/tab-mine.png',
        selectedIconPath: 'assets/images/tab-mine-active.png'
      }
    ]
  }
})
