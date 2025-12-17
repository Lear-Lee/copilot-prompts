# 微信小程序开发规范

> 基于微信官方开发文档与优质开源项目最佳实践  
> 版本：适用于基础库 3.0+

## 🎯 核心原则

1. **组件化开发** - 充分利用自定义组件，提高代码复用性
2. **数据驱动视图** - 使用 setData 更新视图，避免直接操作 DOM
3. **性能优先** - 优化渲染性能，控制 setData 频率和数据大小
4. **用户体验** - 完善的加载状态、错误处理和交互反馈
5. **安全规范** - 敏感信息加密，接口鉴权，防止 XSS 攻击

---

## 📁 项目结构

### 推荐目录结构

```
miniprogram/
├── app.js                    # 小程序逻辑
├── app.json                  # 小程序公共配置
├── app.wxss                  # 小程序公共样式
├── sitemap.json              # 搜索配置
├── project.config.json       # 项目配置
├── project.private.config.json  # 私有配置(不提交)
│
├── pages/                    # 页面目录
│   ├── index/
│   │   ├── index.js         # 页面逻辑
│   │   ├── index.json       # 页面配置
│   │   ├── index.wxml       # 页面结构
│   │   └── index.wxss       # 页面样式
│   └── ...
│
├── components/               # 自定义组件
│   ├── user-card/
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── ...
│
├── utils/                    # 工具函数
│   ├── request.js           # 网络请求封装
│   ├── storage.js           # 本地存储封装
│   ├── auth.js              # 鉴权工具
│   └── util.js              # 通用工具
│
├── api/                      # API 接口管理
│   ├── user.js
│   ├── product.js
│   └── order.js
│
├── config/                   # 配置文件
│   ├── env.js               # 环境配置
│   └── constants.js         # 常量定义
│
├── models/                   # 数据模型
│   └── user.js
│
├── store/                    # 全局状态管理(可选)
│   └── index.js
│
├── styles/                   # 公共样式
│   ├── variables.wxss       # CSS 变量
│   └── common.wxss          # 公共样式
│
└── images/                   # 图片资源
    ├── icons/
    └── ...
```

### 文件命名规范

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 页面 | kebab-case | `user-profile/` |
| 组件 | kebab-case | `product-card/` |
| JS 文件 | camelCase | `userService.js` |
| 常量文件 | UPPER_CASE | `API_CONFIG.js` |

---

## 📄 页面开发规范

### Page 生命周期

```javascript
// pages/user/user.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    list: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {Object} options - 页面参数
   */
  onLoad(options) {
    // ✅ 获取路由参数
    const { id } = options
    
    // ✅ 初始化数据
    this.fetchUserInfo(id)
    this.fetchList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // ✅ 可以进行页面节点操作
    wx.setNavigationBarTitle({
      title: '用户中心'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // ✅ 页面每次显示时执行
    // 适合刷新页面数据
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // ✅ 页面隐藏时执行
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // ✅ 清理定时器、取消请求等
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // ✅ 刷新数据
    this.setData({
      page: 1,
      list: [],
      hasMore: true
    })
    
    this.fetchList().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // ✅ 加载更多
    if (!this.data.hasMore || this.data.loading) return
    
    this.setData({
      page: this.data.page + 1
    })
    this.fetchList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '分享标题',
      path: `/pages/user/user?id=${this.data.userInfo.id}`,
      imageUrl: this.data.userInfo.avatar
    }
  },

  /**
   * 获取用户信息
   */
  async fetchUserInfo(id) {
    try {
      this.setData({ loading: true })
      
      const res = await userApi.getUserInfo({ id })
      
      this.setData({
        userInfo: res.data
      })
    } catch (error) {
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: '获取信息失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 获取列表数据
   */
  async fetchList() {
    try {
      this.setData({ loading: true })
      
      const { page } = this.data
      const res = await userApi.getList({ page, pageSize: 10 })
      
      this.setData({
        list: page === 1 ? res.data.list : [...this.data.list, ...res.data.list],
        hasMore: res.data.hasMore
      })
    } catch (error) {
      console.error('获取列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 跳转到详情页
   */
  handleNavigateToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
```

### WXML 模板规范

```xml
<!-- ✅ 正确示例 -->
<view class="container">
  <!-- 加载状态 -->
  <view wx:if="{{loading}}" class="loading">
    <text>加载中...</text>
  </view>

  <!-- 数据展示 -->
  <block wx:else>
    <!-- 条件渲染 -->
    <view wx:if="{{userInfo}}" class="user-info">
      <image class="avatar" src="{{userInfo.avatar}}" mode="aspectFill" />
      <text class="name">{{userInfo.name}}</text>
    </view>

    <!-- 列表渲染 - 必须添加 key -->
    <view 
      wx:for="{{list}}" 
      wx:key="id"
      class="item"
      data-id="{{item.id}}"
      bindtap="handleNavigateToDetail"
    >
      <text>{{item.title}}</text>
      <text class="time">{{item.createTime}}</text>
    </view>

    <!-- 空状态 -->
    <view wx:if="{{list.length === 0 && !loading}}" class="empty">
      <text>暂无数据</text>
    </view>
  </block>
</view>

<!-- ❌ 错误示例 -->
<!-- 1. 缺少 wx:key -->
<view wx:for="{{list}}">
  {{item.name}}
</view>

<!-- 2. 复杂的模板表达式 -->
<text>{{list.filter(item => item.active).map(i => i.name).join(', ')}}</text>
<!-- 应该在 JS 中处理 -->

<!-- 3. 内联样式过多 -->
<view style="width: 100px; height: 100px; background: red; margin: 10px;">
  内容
</view>
<!-- 应该使用 class -->
```

### WXSS 样式规范

```css
/* ✅ 使用 CSS 变量 */
page {
  --primary-color: #1aad19;
  --text-color: #333;
  --border-color: #e5e5e5;
  --bg-color: #f5f5f5;
}

/* ✅ BEM 命名规范 */
.user-card {
  padding: 20rpx;
  background: #fff;
}

.user-card__avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}

.user-card__name {
  font-size: 32rpx;
  color: var(--text-color);
}

.user-card__name--vip {
  color: #ff9500;
}

/* ✅ 响应式单位 rpx */
.container {
  width: 750rpx;
  padding: 30rpx;
}

/* ✅ Flex 布局 */
.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

/* ❌ 避免使用固定像素 px（特殊情况除外） */
.bad-width {
  width: 375px;  /* 不推荐 */
}

/* ❌ 避免过深的选择器嵌套 */
.page .container .content .item .title .text {
  /* 太深了！ */
}
```

---

## 🧩 组件开发规范

### 自定义组件

```javascript
// components/user-card/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // ✅ 完整的属性定义
    user: {
      type: Object,
      value: null,
      observer(newVal, oldVal) {
        // 属性变化时的处理
        if (newVal) {
          this._processUserData(newVal)
        }
      }
    },
    
    size: {
      type: String,
      value: 'medium', // small | medium | large
      validator(value) {
        return ['small', 'medium', 'large'].includes(value)
      }
    },
    
    showActions: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    processedUser: null,
    isFollowing: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理用户数据
     * @private
     */
    _processUserData(user) {
      // ✅ 私有方法使用 _ 前缀
      this.setData({
        processedUser: {
          ...user,
          displayName: user.nickname || user.name
        }
      })
    },

    /**
     * 关注/取消关注
     */
    async handleFollow() {
      const { user } = this.properties
      const { isFollowing } = this.data

      try {
        if (isFollowing) {
          await userApi.unfollow({ userId: user.id })
        } else {
          await userApi.follow({ userId: user.id })
        }

        this.setData({
          isFollowing: !isFollowing
        })

        // ✅ 触发自定义事件
        this.triggerEvent('followchange', {
          userId: user.id,
          isFollowing: !isFollowing
        })

        wx.showToast({
          title: isFollowing ? '已取消关注' : '关注成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('操作失败:', error)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    },

    /**
     * 跳转到用户主页
     */
    handleNavigateToProfile() {
      const { user } = this.properties
      
      // ✅ 触发导航事件，由父组件处理
      this.triggerEvent('navigate', {
        userId: user.id
      })
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // ✅ 组件被挂载到页面时执行
    },

    detached() {
      // ✅ 组件从页面移除时执行
      // 清理定时器等
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show() {
      // ✅ 页面显示时执行
    },

    hide() {
      // ✅ 页面隐藏时执行
    }
  }
})
```

### 组件 WXML

```xml
<!-- components/user-card/index.wxml -->
<view class="user-card user-card--{{size}}">
  <!-- 用户信息 -->
  <view class="user-card__info" bindtap="handleNavigateToProfile">
    <image 
      class="user-card__avatar" 
      src="{{user.avatar}}" 
      mode="aspectFill"
    />
    <view class="user-card__detail">
      <text class="user-card__name">{{processedUser.displayName}}</text>
      <text class="user-card__desc">{{user.bio}}</text>
    </view>
  </view>

  <!-- 操作按钮 -->
  <view wx:if="{{showActions}}" class="user-card__actions">
    <button 
      class="user-card__btn {{isFollowing ? 'user-card__btn--following' : ''}}"
      bindtap="handleFollow"
    >
      {{isFollowing ? '已关注' : '关注'}}
    </button>
  </view>
</view>
```

### 组件配置

```json
{
  "component": true,
  "usingComponents": {}
}
```

---

## 🌐 网络请求规范

### 请求封装

```javascript
// utils/request.js

const BASE_URL = 'https://api.example.com'
const TOKEN_KEY = 'auth_token'

/**
 * 网络请求封装
 * @param {Object} options - 请求配置
 * @param {string} options.url - 请求路径
 * @param {string} options.method - 请求方法
 * @param {Object} options.data - 请求数据
 * @param {Object} options.header - 请求头
 * @param {boolean} options.needAuth - 是否需要鉴权
 * @param {boolean} options.showLoading - 是否显示加载提示
 * @returns {Promise}
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    needAuth = true,
    showLoading = true
  } = options

  // ✅ 显示加载提示
  if (showLoading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    // ✅ 构建请求头
    const requestHeader = {
      'content-type': 'application/json',
      ...header
    }

    // ✅ 添加 Token
    if (needAuth) {
      const token = wx.getStorageSync(TOKEN_KEY)
      if (token) {
        requestHeader['Authorization'] = `Bearer ${token}`
      }
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: requestHeader,
      success: (res) => {
        if (showLoading) {
          wx.hideLoading()
        }

        // ✅ 统一处理响应
        const { statusCode, data } = res

        if (statusCode === 200) {
          // ✅ 业务成功
          if (data.code === 0) {
            resolve(data)
          } else {
            // ✅ 业务失败
            const errorMsg = data.message || '请求失败'
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            })
            reject(new Error(errorMsg))
          }
        } else if (statusCode === 401) {
          // ✅ 未授权，跳转登录
          wx.removeStorageSync(TOKEN_KEY)
          wx.redirectTo({
            url: '/pages/login/login'
          })
          reject(new Error('未授权'))
        } else {
          // ✅ 其他错误
          const errorMsg = '网络请求失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
          reject(new Error(errorMsg))
        }
      },
      fail: (error) => {
        if (showLoading) {
          wx.hideLoading()
        }

        // ✅ 网络错误处理
        console.error('网络请求失败:', error)
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(error)
      }
    })
  })
}

module.exports = {
  request,
  
  // ✅ 快捷方法
  get(url, data, options = {}) {
    return request({ url, method: 'GET', data, ...options })
  },

  post(url, data, options = {}) {
    return request({ url, method: 'POST', data, ...options })
  },

  put(url, data, options = {}) {
    return request({ url, method: 'PUT', data, ...options })
  },

  delete(url, data, options = {}) {
    return request({ url, method: 'DELETE', data, ...options })
  }
}
```

### API 管理

```javascript
// api/user.js
const { get, post } = require('../utils/request')

module.exports = {
  /**
   * 获取用户信息
   */
  getUserInfo(data) {
    return get('/user/info', data)
  },

  /**
   * 更新用户信息
   */
  updateUserInfo(data) {
    return post('/user/update', data)
  },

  /**
   * 获取用户列表
   */
  getUserList(data) {
    return get('/user/list', data)
  },

  /**
   * 关注用户
   */
  followUser(data) {
    return post('/user/follow', data)
  },

  /**
   * 取消关注
   */
  unfollowUser(data) {
    return post('/user/unfollow', data)
  }
}
```

---

## ☁️ 云开发规范

> 微信小程序云开发提供云函数、云数据库、云存储、云调用等能力

### 云开发初始化

```javascript
// app.js
App({
  onLaunch() {
    // ✅ 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 云开发环境 ID
        traceUser: true     // 记录用户访问记录
      })
    }
  }
})
```

### 环境配置管理

```javascript
// config/cloud.js

// ✅ 多环境配置
const ENV_CONFIG = {
  development: {
    envId: 'dev-xxxxx',
    functionRoot: 'cloudfunctions'
  },
  production: {
    envId: 'prod-xxxxx',
    functionRoot: 'cloudfunctions'
  }
}

const currentEnv = process.env.NODE_ENV || 'development'

module.exports = {
  ...ENV_CONFIG[currentEnv],
  // 云函数超时时间（毫秒）
  timeout: 10000
}
```

---

### 云函数开发规范

#### 云函数结构

```javascript
// cloudfunctions/getUserInfo/index.js

const cloud = require('wx-server-sdk')

// ✅ 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取用户信息云函数
 * @param {Object} event - 云函数调用参数
 * @param {string} event.userId - 用户 ID
 * @returns {Object} 用户信息
 */
exports.main = async (event, context) => {
  // ✅ 获取调用者信息
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()
  
  try {
    // ✅ 参数验证
    if (!event.userId) {
      return {
        success: false,
        message: '缺少必要参数 userId'
      }
    }

    // ✅ 数据库查询
    const result = await db.collection('users')
      .doc(event.userId)
      .get()

    // ✅ 返回统一格式
    return {
      success: true,
      data: result.data,
      openid: OPENID
    }
  } catch (error) {
    // ✅ 错误处理
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
```

#### 小程序端调用云函数

```javascript
// utils/cloudFunctions.js

/**
 * 调用云函数封装
 * @param {string} name - 云函数名称
 * @param {Object} data - 传递参数
 * @returns {Promise}
 */
async function callFunction(name, data = {}) {
  try {
    wx.showLoading({ title: '处理中...', mask: true })
    
    const res = await wx.cloud.callFunction({
      name,
      data
    })
    
    wx.hideLoading()
    
    // ✅ 统一处理响应
    if (res.result.success) {
      return res.result
    } else {
      throw new Error(res.result.message || '操作失败')
    }
  } catch (error) {
    wx.hideLoading()
    console.error(`调用云函数 ${name} 失败:`, error)
    
    wx.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    })
    
    throw error
  }
}

module.exports = {
  callFunction,
  
  // ✅ 具体业务方法
  getUserInfo(userId) {
    return callFunction('getUserInfo', { userId })
  },
  
  createOrder(orderData) {
    return callFunction('createOrder', orderData)
  }
}
```

---

### 云数据库规范

#### 数据库集合设计

```javascript
// ✅ 用户集合 (users)
{
  _id: 'user_xxx',
  _openid: 'oXXXX',           // 用户 openid（自动生成）
  nickname: '张三',
  avatar: 'https://...',
  phone: '13800138000',
  createTime: new Date(),
  updateTime: new Date()
}

// ✅ 订单集合 (orders)
{
  _id: 'order_xxx',
  _openid: 'oXXXX',           // 下单用户
  userId: 'user_xxx',
  products: [
    { id: 'prod_1', name: '商品1', price: 100, count: 2 }
  ],
  totalPrice: 200,
  status: 'pending',          // pending | paid | shipped | completed
  createTime: new Date()
}
```

#### 数据库操作封装

```javascript
// utils/cloudDB.js

const db = wx.cloud.database()
const _ = db.command

/**
 * 数据库操作工具类
 */
class CloudDB {
  constructor(collectionName) {
    this.collection = db.collection(collectionName)
  }

  /**
   * 添加记录
   */
  async add(data) {
    try {
      const res = await this.collection.add({
        data: {
          ...data,
          createTime: new Date(),
          updateTime: new Date()
        }
      })
      return { success: true, id: res._id }
    } catch (error) {
      console.error('添加记录失败:', error)
      throw error
    }
  }

  /**
   * 查询记录（分页）
   */
  async getList({ page = 1, pageSize = 10, where = {}, orderBy = 'createTime', order = 'desc' }) {
    try {
      const skip = (page - 1) * pageSize
      
      const countRes = await this.collection.where(where).count()
      const total = countRes.total
      
      const res = await this.collection
        .where(where)
        .orderBy(orderBy, order)
        .skip(skip)
        .limit(pageSize)
        .get()
      
      return {
        success: true,
        data: res.data,
        total,
        page,
        pageSize,
        hasMore: skip + res.data.length < total
      }
    } catch (error) {
      console.error('查询列表失败:', error)
      throw error
    }
  }

  /**
   * 获取单条记录
   */
  async getById(id) {
    try {
      const res = await this.collection.doc(id).get()
      return { success: true, data: res.data }
    } catch (error) {
      console.error('获取记录失败:', error)
      throw error
    }
  }

  /**
   * 更新记录
   */
  async update(id, data) {
    try {
      await this.collection.doc(id).update({
        data: {
          ...data,
          updateTime: new Date()
        }
      })
      return { success: true }
    } catch (error) {
      console.error('更新记录失败:', error)
      throw error
    }
  }

  /**
   * 删除记录
   */
  async remove(id) {
    try {
      await this.collection.doc(id).remove()
      return { success: true }
    } catch (error) {
      console.error('删除记录失败:', error)
      throw error
    }
  }
}

// ✅ 导出实例
module.exports = {
  CloudDB,
  usersDB: new CloudDB('users'),
  ordersDB: new CloudDB('orders'),
  productsDB: new CloudDB('products')
}
```

#### 使用示例

```javascript
// pages/user/user.js
const { usersDB } = require('../../utils/cloudDB')

Page({
  data: {
    users: [],
    page: 1
  },

  async onLoad() {
    await this.fetchUsers()
  },

  async fetchUsers() {
    try {
      const res = await usersDB.getList({
        page: this.data.page,
        pageSize: 10,
        where: {
          // ✅ 查询条件
          status: 'active'
        }
      })

      this.setData({
        users: res.data,
        hasMore: res.hasMore
      })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }
})
```

---

### 云存储规范

#### 文件上传

```javascript
// utils/cloudStorage.js

/**
 * 上传文件到云存储
 * @param {string} filePath - 本地文件路径
 * @param {string} cloudPath - 云存储路径
 * @returns {Promise}
 */
async function uploadFile(filePath, cloudPath) {
  try {
    wx.showLoading({ title: '上传中...', mask: true })
    
    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    })
    
    wx.hideLoading()
    
    return {
      success: true,
      fileID: res.fileID
    }
  } catch (error) {
    wx.hideLoading()
    console.error('上传文件失败:', error)
    
    wx.showToast({
      title: '上传失败',
      icon: 'none'
    })
    
    throw error
  }
}

/**
 * 选择并上传图片
 * @param {Object} options - 配置选项
 * @returns {Promise}
 */
async function chooseAndUploadImage(options = {}) {
  const {
    count = 1,
    sizeType = ['compressed'],
    sourceType = ['album', 'camera'],
    folder = 'images'
  } = options

  try {
    // ✅ 选择图片
    const chooseRes = await wx.chooseImage({
      count,
      sizeType,
      sourceType
    })

    const uploadTasks = chooseRes.tempFilePaths.map((filePath, index) => {
      // ✅ 生成云存储路径
      const ext = filePath.split('.').pop()
      const cloudPath = `${folder}/${Date.now()}_${index}.${ext}`
      
      return uploadFile(filePath, cloudPath)
    })

    const results = await Promise.all(uploadTasks)
    
    return {
      success: true,
      fileIDs: results.map(r => r.fileID)
    }
  } catch (error) {
    console.error('选择上传图片失败:', error)
    throw error
  }
}

/**
 * 下载文件
 * @param {string} fileID - 云文件 ID
 * @returns {Promise}
 */
async function downloadFile(fileID) {
  try {
    const res = await wx.cloud.downloadFile({
      fileID
    })
    
    return {
      success: true,
      tempFilePath: res.tempFilePath
    }
  } catch (error) {
    console.error('下载文件失败:', error)
    throw error
  }
}

/**
 * 删除文件
 * @param {Array<string>} fileIDs - 云文件 ID 数组
 * @returns {Promise}
 */
async function deleteFiles(fileIDs) {
  try {
    const res = await wx.cloud.deleteFile({
      fileList: fileIDs
    })
    
    return {
      success: true,
      fileList: res.fileList
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    throw error
  }
}

module.exports = {
  uploadFile,
  chooseAndUploadImage,
  downloadFile,
  deleteFiles
}
```

#### 使用示例

```javascript
// pages/upload/upload.js
const { chooseAndUploadImage } = require('../../utils/cloudStorage')

Page({
  data: {
    imageUrls: []
  },

  async handleUploadImage() {
    try {
      const res = await chooseAndUploadImage({
        count: 3,
        folder: 'user-uploads'
      })

      this.setData({
        imageUrls: [...this.data.imageUrls, ...res.fileIDs]
      })

      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      // 错误已在封装函数中处理
    }
  }
})
```

---

### 云调用规范

#### 发送订阅消息

```javascript
// cloudfunctions/sendMessage/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 发送订阅消息
 */
exports.main = async (event, context) => {
  const { touser, templateId, page, data } = event

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      page,
      data,
      templateId,
      miniprogramState: 'formal' // formal | trial | developer
    })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('发送订阅消息失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
```

#### 生成小程序码

```javascript
// cloudfunctions/generateQRCode/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 生成小程序码
 */
exports.main = async (event, context) => {
  const { scene, page, width = 430 } = event

  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene,
      page,
      width,
      autoColor: false,
      lineColor: { r: 0, g: 0, b: 0 }
    })

    // ✅ 上传到云存储
    const upload = await cloud.uploadFile({
      cloudPath: `qrcodes/${Date.now()}.png`,
      fileContent: result.buffer
    })

    return {
      success: true,
      fileID: upload.fileID
    }
  } catch (error) {
    console.error('生成小程序码失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
```

---

### 云开发最佳实践

#### 1. 数据库权限配置

```json
// 云数据库权限配置（在云开发控制台设置）
{
  "read": "doc._openid == auth.openid",  // 只能读取自己的数据
  "write": "doc._openid == auth.openid"  // 只能写入自己的数据
}
```

#### 2. 云函数并发控制

```javascript
// cloudfunctions/batchProcess/index.js

/**
 * 批量处理数据（控制并发）
 */
exports.main = async (event, context) => {
  const { items } = event
  const BATCH_SIZE = 5 // 每批处理 5 个

  try {
    const results = []
    
    // ✅ 分批处理，避免超时
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(item => processItem(item))
      )
      results.push(...batchResults)
    }

    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('批量处理失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
```

#### 3. 云函数错误监控

```javascript
// cloudfunctions/common/errorHandler.js

/**
 * 统一错误处理
 */
function handleError(error, functionName) {
  // ✅ 记录错误日志
  console.error(`[${functionName}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date()
  })

  // ✅ 错误上报（可接入第三方监控）
  // reportError(functionName, error)

  // ✅ 返回统一错误格式
  return {
    success: false,
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || '服务器错误'
  }
}

module.exports = {
  handleError
}
```

#### 4. 云存储安全规则

```javascript
// ✅ 限制文件大小和类型
async function uploadWithValidation(filePath, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024,      // 最大 5MB
    allowedTypes = ['image/jpeg', 'image/png']
  } = options

  try {
    // ✅ 获取文件信息
    const fileInfo = await wx.getFileInfo({ filePath })
    
    // ✅ 验证文件大小
    if (fileInfo.size > maxSize) {
      throw new Error('文件大小超过限制')
    }

    // ✅ 验证文件类型（需要额外检查）
    // 实际项目中应该检查文件扩展名或 MIME 类型

    // ✅ 上传文件
    const cloudPath = `uploads/${Date.now()}_${Math.random()}.jpg`
    return await uploadFile(filePath, cloudPath)
  } catch (error) {
    console.error('上传验证失败:', error)
    throw error
  }
}
```

---

### 云开发安全规范

#### 1. 敏感操作必须在云函数中执行

```javascript
// ❌ 错误：在小程序端直接操作敏感数据
// pages/order/order.js
await db.collection('orders').add({
  data: {
    userId: 'xxx',
    totalPrice: 100,  // 价格可被篡改！
    status: 'paid'    // 状态可被篡改！
  }
})

// ✅ 正确：通过云函数处理
// cloudfunctions/createOrder/index.js
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { productId, count } = event

  // ✅ 在服务端计算价格
  const product = await db.collection('products').doc(productId).get()
  const totalPrice = product.data.price * count

  // ✅ 创建订单
  await db.collection('orders').add({
    data: {
      _openid: OPENID,
      productId,
      count,
      totalPrice,    // 服务端计算，安全
      status: 'pending',
      createTime: new Date()
    }
  })

  return { success: true }
}
```

#### 2. 数据库查询优化

```javascript
// ✅ 使用索引
// 在云开发控制台为常用查询字段创建索引

// ✅ 避免全表扫描
// ❌ 错误
const res = await db.collection('orders').get() // 可能超出限制

// ✅ 正确：添加条件和限制
const res = await db.collection('orders')
  .where({
    _openid: OPENID,
    status: 'pending'
  })
  .limit(20)
  .get()
```

#### 3. 云函数冷启动优化

```javascript
// ✅ 复用全局变量
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()  // 在函数外初始化

exports.main = async (event, context) => {
  // 直接使用已初始化的 db
  const res = await db.collection('users').get()
  return res
}
```

---

## 💾 本地存储规范

### 存储封装

```javascript
// utils/storage.js

/**
 * 设置存储
 * @param {string} key - 键名
 * @param {any} value - 值
 * @returns {Promise}
 */
function setStorage(key, value) {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key,
      data: value,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 获取存储
 * @param {string} key - 键名
 * @returns {Promise}
 */
function getStorage(key) {
  return new Promise((resolve, reject) => {
    wx.getStorage({
      key,
      success: (res) => resolve(res.data),
      fail: reject
    })
  })
}

/**
 * 同步设置存储
 */
function setStorageSync(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (error) {
    console.error('存储失败:', error)
    return false
  }
}

/**
 * 同步获取存储
 */
function getStorageSync(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key)
    return value !== '' ? value : defaultValue
  } catch (error) {
    console.error('读取存储失败:', error)
    return defaultValue
  }
}

/**
 * 移除存储
 */
function removeStorage(key) {
  return new Promise((resolve, reject) => {
    wx.removeStorage({
      key,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 清空存储
 */
function clearStorage() {
  return new Promise((resolve, reject) => {
    wx.clearStorage({
      success: resolve,
      fail: reject
    })
  })
}

module.exports = {
  setStorage,
  getStorage,
  setStorageSync,
  getStorageSync,
  removeStorage,
  clearStorage
}
```

### 存储命名规范

```javascript
// config/constants.js

// ✅ 统一管理存储 key
const STORAGE_KEYS = {
  USER_INFO: 'user_info',
  AUTH_TOKEN: 'auth_token',
  SETTINGS: 'app_settings',
  CACHE_DATA: 'cache_data',
  SEARCH_HISTORY: 'search_history'
}

module.exports = {
  STORAGE_KEYS
}
```

---

## 🎯 性能优化

### setData 优化

```javascript
// ❌ 错误：频繁调用 setData
for (let i = 0; i < 100; i++) {
  this.setData({
    count: i
  })
}

// ✅ 正确：合并多次 setData
const updates = {}
for (let i = 0; i < 100; i++) {
  updates.count = i
}
this.setData(updates)

// ❌ 错误：setData 数据过大
this.setData({
  hugeList: [...Array(1000).keys()]  // 一次传输大量数据
})

// ✅ 正确：只更新需要的字段
this.setData({
  [`list[${index}].name`]: newName  // 局部更新
})

// ❌ 错误：不必要的数据
this.setData({
  userInfo: {
    ...user,
    _rawData: rawData,  // 不需要在视图中使用的数据
    _cache: cache
  }
})

// ✅ 正确：只传必要数据
this.setData({
  userInfo: {
    id: user.id,
    name: user.name,
    avatar: user.avatar
  }
})
```

### 列表渲染优化

```xml
<!-- ✅ 使用虚拟列表（长列表） -->
<recycle-view 
  batch="{{batchSetRecycleData}}" 
  height="{{height}}"
>
  <recycle-item wx:for="{{list}}" wx:key="id">
    <view>{{item.name}}</view>
  </recycle-item>
</recycle-view>

<!-- ✅ 使用分页加载 -->
<scroll-view 
  scroll-y 
  bindscrolltolower="onReachBottom"
  lower-threshold="100"
>
  <view wx:for="{{list}}" wx:key="id">
    {{item.name}}
  </view>
</scroll-view>

<!-- ✅ 图片懒加载 -->
<image 
  src="{{item.image}}" 
  lazy-load
  mode="aspectFill"
/>
```

### 代码分包

```json
// app.json
{
  "pages": [
    "pages/index/index",
    "pages/user/user"
  ],
  "subpackages": [
    {
      "root": "packageA",
      "pages": [
        "pages/detail/detail",
        "pages/list/list"
      ]
    },
    {
      "root": "packageB",
      "name": "vip",
      "pages": [
        "pages/vip/vip"
      ],
      "independent": true  // 独立分包
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["packageA"]
    }
  }
}
```

---

## 🔐 安全规范

### 敏感信息处理

```javascript
// ❌ 错误：直接存储敏感信息
wx.setStorageSync('password', '123456')

// ✅ 正确：加密后存储
const CryptoJS = require('crypto-js')

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString()
}

function decryptData(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key)
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}
```

### XSS 防护

```javascript
// ✅ 转义用户输入
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// 使用
this.setData({
  safeContent: escapeHtml(userInput)
})
```

### 接口鉴权

```javascript
// utils/auth.js

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

/**
 * 保存 Token
 */
function saveToken(token, refreshToken) {
  wx.setStorageSync(TOKEN_KEY, token)
  if (refreshToken) {
    wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken)
  }
}

/**
 * 获取 Token
 */
function getToken() {
  return wx.getStorageSync(TOKEN_KEY)
}

/**
 * 清除 Token
 */
function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(REFRESH_TOKEN_KEY)
}

/**
 * 检查登录状态
 */
function checkLogin() {
  return !!getToken()
}

/**
 * 刷新 Token
 */
async function refreshToken() {
  const refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY)
  
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  try {
    const res = await authApi.refreshToken({ refreshToken })
    saveToken(res.data.token, res.data.refreshToken)
    return res.data.token
  } catch (error) {
    clearToken()
    throw error
  }
}

module.exports = {
  saveToken,
  getToken,
  clearToken,
  checkLogin,
  refreshToken
}
```

---

## 📱 用户体验

### 加载状态

```javascript
// ✅ 统一的 loading 管理
class LoadingManager {
  constructor() {
    this.loadingCount = 0
  }

  show(title = '加载中...') {
    this.loadingCount++
    if (this.loadingCount === 1) {
      wx.showLoading({
        title,
        mask: true
      })
    }
  }

  hide() {
    this.loadingCount--
    if (this.loadingCount === 0) {
      wx.hideLoading()
    }
  }

  clear() {
    this.loadingCount = 0
    wx.hideLoading()
  }
}

const loadingManager = new LoadingManager()

module.exports = loadingManager
```

### 错误处理

```javascript
// ✅ 统一错误处理
function handleError(error, showToast = true) {
  console.error('Error:', error)

  if (showToast) {
    const message = error.message || '操作失败，请重试'
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  }

  // ✅ 上报错误到监控平台
  if (typeof wx.reportMonitor === 'function') {
    wx.reportMonitor('error', {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    })
  }
}

module.exports = {
  handleError
}
```

### 交互反馈

```javascript
// ✅ 完善的用户反馈

// 成功提示
wx.showToast({
  title: '操作成功',
  icon: 'success',
  duration: 2000
})

// 失败提示
wx.showToast({
  title: '操作失败',
  icon: 'none',
  duration: 2000
})

// 确认对话框
wx.showModal({
  title: '提示',
  content: '确认删除这条记录吗？',
  confirmText: '删除',
  confirmColor: '#ff4444',
  success: (res) => {
    if (res.confirm) {
      // 用户确认
      this.handleDelete()
    }
  }
})

// 操作菜单
wx.showActionSheet({
  itemList: ['拍照', '从相册选择'],
  success: (res) => {
    if (res.tapIndex === 0) {
      // 拍照
    } else if (res.tapIndex === 1) {
      // 选择照片
    }
  }
})
```

---

## 🧪 调试与测试

### 调试技巧

```javascript
// ✅ 环境判断
const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  console.log('Debug info:', data)
}

// ✅ 性能监控
const startTime = Date.now()
// ... 执行操作
const endTime = Date.now()
console.log(`操作耗时: ${endTime - startTime}ms`)

// ✅ 使用 vConsole
if (isDev) {
  const VConsole = require('vconsole')
  new VConsole()
}
```

### 单元测试

```javascript
// test/utils/format.test.js
const { formatDate, formatNumber } = require('../../utils/format')

describe('format utils', () => {
  test('formatDate should format timestamp correctly', () => {
    const timestamp = 1609459200000 // 2021-01-01 00:00:00
    expect(formatDate(timestamp)).toBe('2021-01-01')
  })

  test('formatNumber should format number with comma', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })
})
```

---

## ❌ 禁止模式

### 代码层面

```javascript
// ❌ 直接修改 data
this.data.count = 10  // 不会触发视图更新

// ✅ 使用 setData
this.setData({
  count: 10
})

// ❌ 在 WXML 中写复杂逻辑
<view>{{list.filter(i => i.active).length}}</view>

// ✅ 在 JS 中计算
computed() {
  return {
    activeCount: this.data.list.filter(i => i.active).length
  }
}

// ❌ 没有错误处理
async fetchData() {
  const res = await api.getData()
  this.setData({ data: res.data })
}

// ✅ 完善的错误处理
async fetchData() {
  try {
    const res = await api.getData()
    this.setData({ data: res.data })
  } catch (error) {
    console.error('获取数据失败:', error)
    wx.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}
```

### 性能陷阱

```javascript
// ❌ 在循环中频繁调用 setData
for (let i = 0; i < items.length; i++) {
  this.setData({
    [`items[${i}]`]: items[i]
  })
}

// ✅ 一次性更新
this.setData({
  items: items
})

// ❌ setData 传递大量无用数据
this.setData({
  hugeObject: {
    // 包含很多视图不需要的数据
    _internalState: {},
    _cache: {},
    displayData: {}
  }
})

// ✅ 只传递必要数据
this.setData({
  displayData: hugeObject.displayData
})
```

---

## ✅ 最佳实践总结

### 开发规范清单

- [ ] **文件组织**: 遵循推荐的目录结构
- [ ] **命名规范**: 使用 kebab-case/camelCase
- [ ] **代码注释**: 为复杂逻辑添加注释
- [ ] **错误处理**: 所有异步操作都有 try-catch
- [ ] **加载状态**: 异步操作显示 loading
- [ ] **用户反馈**: 操作结果有明确提示

### 性能优化清单

- [ ] **setData 优化**: 减少调用频率，控制数据大小
- [ ] **列表优化**: 长列表使用虚拟列表或分页
- [ ] **图片优化**: 使用 lazy-load，压缩图片
- [ ] **代码分包**: 合理使用分包和预加载
- [ ] **避免白屏**: 骨架屏/占位图

### 安全规范清单

- [ ] **敏感信息**: 加密存储，不明文传输
- [ ] **XSS 防护**: 转义用户输入
- [ ] **接口鉴权**: Token 验证，刷新机制
- [ ] **HTTPS**: 所有接口使用 HTTPS
- [ ] **权限校验**: 敏感操作二次确认

### 用户体验清单

- [ ] **加载提示**: 所有异步操作有反馈
- [ ] **错误提示**: 清晰的错误信息
- [ ] **空状态**: 无数据时显示空状态
- [ ] **下拉刷新**: 列表支持下拉刷新
- [ ] **上拉加载**: 长列表支持分页加载

---

## 📚 参考资源

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信小程序开发指南](https://developers.weixin.qq.com/ebook?action=get_post_info&docid=0008aeea9a8978b00086a685851c0a)
- [小程序性能优化指南](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/)
- [小程序安全指南](https://developers.weixin.qq.com/miniprogram/dev/framework/security.html)

---

**维护团队**: MTA工作室  
**版本**: 1.0.0  
**更新日期**: 2025-12-17
