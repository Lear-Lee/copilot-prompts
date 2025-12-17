# 微信小程序开发 Agent

> 专注于微信小程序开发的 Copilot Agent  
> 遵循官方规范和最佳实践

## 🎯 适用场景

- 微信小程序项目开发
- 小程序组件开发
- 小程序性能优化
- 小程序架构设计

---

## ⚠️ 强制工作流

**在编写任何小程序代码前，必须先调用 MCP 工具加载规范！**

### 开发页面时

```
get_relevant_standards({ 
  fileType: "js",
  imports: ["wx"],
  scenario: "小程序页面开发"
})
```

### 开发组件时

```
get_relevant_standards({ 
  fileType: "js",
  imports: ["wx", "Component"],
  scenario: "小程序组件开发"
})
```

### 网络请求相关

```
get_relevant_standards({ 
  scenario: "小程序网络请求"
})
```

### 本地存储相关

```
get_relevant_standards({ 
  scenario: "小程序本地存储"
})
```

### 云开发相关 🆕

```
get_relevant_standards({ 
  scenario: "小程序云开发"
})

# 或具体场景
get_relevant_standards({ 
  scenario: "云函数开发"
})

get_relevant_standards({ 
  scenario: "云数据库操作"
})

get_relevant_standards({ 
  scenario: "云存储管理"
})
```

---

## 🏗️ 项目架构

### 目录结构

```
miniprogram/
├── app.js                    # 小程序逻辑
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── pages/                    # 页面目录
├── components/               # 组件目录
├── utils/                    # 工具函数
├── api/                      # API 管理
├── config/                   # 配置文件
└── styles/                   # 公共样式
```

---

## 📝 代码生成规则

### 1. 页面开发

#### Page 结构模板

```javascript
Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    list: [],
    page: 1,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取路由参数
    const { id } = options
    // 初始化数据
    this.fetchData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时的逻辑
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      list: []
    })
    this.fetchData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    
    this.setData({
      page: this.data.page + 1
    })
    this.fetchData()
  },

  /**
   * 获取数据
   */
  async fetchData() {
    try {
      this.setData({ loading: true })
      
      const res = await api.getData({
        page: this.data.page
      })
      
      this.setData({
        list: this.data.page === 1 
          ? res.data.list 
          : [...this.data.list, ...res.data.list],
        hasMore: res.data.hasMore
      })
    } catch (error) {
      console.error('获取数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
```

### 2. 组件开发

#### Component 结构模板

```javascript
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    data: {
      type: Object,
      value: null,
      observer(newVal, oldVal) {
        if (newVal) {
          this._processData(newVal)
        }
      }
    },
    
    size: {
      type: String,
      value: 'medium'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    processedData: null
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理数据（私有方法）
     */
    _processData(data) {
      this.setData({
        processedData: {
          ...data,
          // 处理逻辑
        }
      })
    },

    /**
     * 处理点击事件
     */
    handleClick(e) {
      const { id } = e.currentTarget.dataset
      
      // 触发自定义事件
      this.triggerEvent('itemclick', {
        id
      })
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件挂载时执行
    },

    detached() {
      // 组件移除时执行
    }
  }
})
```

### 3. WXML 模板规范

```xml
<!-- ✅ 标准模板结构 -->
<view class="container">
  <!-- 加载状态 -->
  <view wx:if="{{loading}}" class="loading">
    <text>加载中...</text>
  </view>

  <!-- 内容 -->
  <block wx:else>
    <!-- 列表 - 必须添加 wx:key -->
    <view 
      wx:for="{{list}}" 
      wx:key="id"
      class="item"
      data-id="{{item.id}}"
      bindtap="handleItemClick"
    >
      <text>{{item.title}}</text>
    </view>

    <!-- 空状态 -->
    <view wx:if="{{list.length === 0}}" class="empty">
      <text>暂无数据</text>
    </view>
  </block>
</view>
```

### 4. WXSS 样式规范

```css
/* ✅ 使用 CSS 变量 */
page {
  --primary-color: #1aad19;
  --text-color: #333;
  --border-color: #e5e5e5;
}

/* ✅ BEM 命名 */
.user-card {
  padding: 30rpx;
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

/* ✅ Flex 布局 */
.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
```

---

## 🌐 网络请求规范

### Request 封装

必须包含以下功能：

1. **统一的错误处理**
2. **Token 自动添加**
3. **Loading 状态管理**
4. **401 自动跳转登录**
5. **请求/响应拦截**

```javascript
// utils/request.js
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    needAuth = true,
    showLoading = true
  } = options

  if (showLoading) {
    wx.showLoading({ title: '加载中...', mask: true })
  }

  return new Promise((resolve, reject) => {
    const header = {
      'content-type': 'application/json'
    }

    // 添加 Token
    if (needAuth) {
      const token = wx.getStorageSync('token')
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      }
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (showLoading) wx.hideLoading()

        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(new Error(res.data.message))
          }
        } else if (res.statusCode === 401) {
          // 跳转登录
          wx.redirectTo({ url: '/pages/login/login' })
          reject(new Error('未授权'))
        } else {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          reject(new Error('Network error'))
        }
      },
      fail: (error) => {
        if (showLoading) wx.hideLoading()
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(error)
      }
    })
  })
}
```

---

## 💾 本地存储规范

### 存储封装

```javascript
// utils/storage.js

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
```

---

## 🎯 性能优化原则

### 1. setData 优化

```javascript
// ❌ 错误：频繁调用
for (let i = 0; i < items.length; i++) {
  this.setData({
    [`items[${i}]`]: items[i]
  })
}

// ✅ 正确：合并更新
this.setData({
  items: items
})

// ✅ 正确：局部更新
this.setData({
  [`items[${index}].name`]: newName
})
```

### 2. 列表渲染优化

```xml
<!-- ✅ 图片懒加载 -->
<image src="{{item.image}}" lazy-load mode="aspectFill" />

<!-- ✅ 长列表分页 -->
<scroll-view 
  scroll-y 
  bindscrolltolower="onReachBottom"
  lower-threshold="100"
>
  <view wx:for="{{list}}" wx:key="id">
    {{item.name}}
  </view>
</scroll-view>
```

### 3. 代码分包

```json
{
  "subpackages": [
    {
      "root": "packageA",
      "pages": [
        "pages/detail/detail"
      ]
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

### 1. 敏感信息处理

```javascript
// ❌ 禁止：明文存储密码
wx.setStorageSync('password', '123456')

// ✅ 正确：加密存储
const encrypted = encrypt(password, key)
wx.setStorageSync('password', encrypted)
```

### 2. XSS 防护

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
```

### 3. 接口鉴权

```javascript
// ✅ Token 机制
// 1. 登录时保存 Token
wx.setStorageSync('token', res.data.token)

// 2. 请求时自动添加
header['Authorization'] = `Bearer ${token}`

// 3. 401 时跳转登录
if (res.statusCode === 401) {
  wx.redirectTo({ url: '/pages/login/login' })
}
```

---

## 📱 用户体验规范

### 1. 加载状态

```javascript
// ✅ 所有异步操作显示 loading
async fetchData() {
  try {
    this.setData({ loading: true })
    const res = await api.getData()
    // 处理数据...
  } catch (error) {
    wx.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    this.setData({ loading: false })
  }
}
```

### 2. 错误提示

```javascript
// ✅ 清晰的错误信息
wx.showToast({
  title: '操作失败，请重试',
  icon: 'none',
  duration: 2000
})

// ✅ 确认对话框
wx.showModal({
  title: '提示',
  content: '确认删除这条记录吗？',
  confirmColor: '#ff4444',
  success: (res) => {
    if (res.confirm) {
      this.handleDelete()
    }
  }
})
```

### 3. 空状态

```xml
<!-- ✅ 无数据时显示空状态 -->
<view wx:if="{{list.length === 0 && !loading}}" class="empty">
  <image src="/images/empty.png" class="empty-image" />
  <text class="empty-text">暂无数据</text>
</view>
```

---

## ❌ 禁止模式

### 代码层面

```javascript
// ❌ 直接修改 data
this.data.count = 10

// ✅ 使用 setData
this.setData({ count: 10 })

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
    wx.showToast({ title: '加载失败', icon: 'none' })
  }
}
```

### 性能陷阱

```javascript
// ❌ setData 过于频繁
for (let i = 0; i < 100; i++) {
  this.setData({ count: i })
}

// ✅ 合并更新
this.setData({ count: 100 })

// ❌ 传递大量无用数据
this.setData({
  hugeObject: entireObject  // 包含很多不需要的字段
})

// ✅ 只传必要数据
this.setData({
  displayData: {
    id: object.id,
    name: object.name
  }
})
```

---

## ✅ 最佳实践总结

### 开发规范

1. **文件组织** - 遵循推荐的目录结构
2. **命名规范** - 使用 kebab-case/camelCase
3. **代码注释** - 为复杂逻辑添加注释
4. **错误处理** - 所有异步操作都有 try-catch
5. **用户反馈** - 操作结果有明确提示

### 性能优化

1. **setData 优化** - 减少调用频率，控制数据大小
2. **列表优化** - 长列表使用分页或虚拟列表
3. **图片优化** - 使用 lazy-load，压缩图片
4. **代码分包** - 合理使用分包和预加载

### 安全规范

1. **敏感信息** - 加密存储，不明文传输
2. **XSS 防护** - 转义用户输入
3. **接口鉴权** - Token 验证，刷新机制
4. **HTTPS** - 所有接口使用 HTTPS

---

## 📚 参考资源

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [小程序开发指南](https://developers.weixin.qq.com/ebook?action=get_post_info&docid=0008aeea9a8978b00086a685851c0a)
- [小程序性能优化](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/)
- [小程序安全指南](https://developers.weixin.qq.com/miniprogram/dev/framework/security.html)

---

**维护团队**: MTA工作室  
**版本**: 1.0.0  
**更新日期**: 2025-12-17
