# 微信小程序开发规范使用指南

## 📋 概述

本指南介绍如何在微信小程序项目中使用 Copilot Prompts 的开发规范。

---

## 🚀 快速开始

### 方式 1: 使用 MCP 工具（推荐）

在 VS Code Copilot Chat 中：

```
@workspace 使用微信小程序规范分析我的代码

或者：

请调用 get_relevant_standards 加载微信小程序规范
```

MCP 服务器会自动识别：
- ✅ `.wxml` / `.wxss` / `.wxs` 文件
- ✅ `wx` API 调用
- ✅ `Page({})` / `Component({})` 代码
- ✅ 场景关键词：小程序、miniprogram 等

### 方式 2: 手动配置

在项目根目录创建 `.github/copilot-instructions.md`：

```markdown
# 微信小程序项目开发规范

⚠️ **强制工作流**

在编写任何小程序代码前，必须先调用 MCP 工具：

\`\`\`
get_relevant_standards({ 
  imports: ["wx"],
  scenario: "小程序开发"
})
\`\`\`

## 🎯 核心原则

1. **组件化开发** - 充分利用自定义组件
2. **数据驱动视图** - 使用 setData 更新
3. **性能优先** - 优化 setData 调用
4. **用户体验** - 完善的反馈和错误处理

## 📁 项目结构

遵循推荐的目录结构：
- `pages/` - 页面目录
- `components/` - 自定义组件
- `utils/` - 工具函数（request.js, storage.js）
- `api/` - API 接口管理
- `config/` - 配置文件

详细规范请参考: [微信小程序开发规范](../../copilot-prompts/standards/frameworks/wechat-miniprogram.md)
```

---

## 📚 规范内容

### 1. 项目结构

```
miniprogram/
├── app.js                    # 小程序逻辑
├── app.json                  # 全局配置
├── pages/                    # 页面
├── components/               # 组件
├── utils/                    # 工具（request, storage）
├── api/                      # API 管理
└── config/                   # 配置
```

### 2. Page 开发规范

```javascript
Page({
  data: {
    loading: false,
    list: []
  },

  onLoad(options) {
    this.fetchData()
  },

  async fetchData() {
    try {
      this.setData({ loading: true })
      const res = await api.getData()
      this.setData({ list: res.data })
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
```

### 3. Component 开发规范

```javascript
Component({
  properties: {
    data: {
      type: Object,
      value: null
    }
  },

  methods: {
    handleClick() {
      this.triggerEvent('itemclick', {
        id: this.data.id
      })
    }
  }
})
```

### 4. 网络请求规范

```javascript
// utils/request.js - 统一封装
function request({ url, method = 'GET', data = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // 跳转登录
          wx.redirectTo({ url: '/pages/login/login' })
        }
      },
      fail: reject
    })
  })
}
```

### 5. 云开发规范 🆕

#### 云函数开发

```javascript
// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    const result = await db.collection('users')
      .doc(event.userId)
      .get()

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}
```

#### 云数据库操作

```javascript
// 小程序端操作云数据库
const db = wx.cloud.database()

// 查询数据
const res = await db.collection('users')
  .where({ status: 'active' })
  .limit(10)
  .get()

// 添加数据
await db.collection('users').add({
  data: {
    name: '张三',
    createTime: new Date()
  }
})
```

#### 云存储管理

```javascript
// 上传文件
const res = await wx.cloud.uploadFile({
  cloudPath: `images/${Date.now()}.jpg`,
  filePath: tempFilePath
})

// 下载文件
await wx.cloud.downloadFile({
  fileID: 'cloud://xxx.jpg'
})
```

### 6. 性能优化

#### setData 优化

```javascript
// ❌ 错误：频繁调用
for (let i = 0; i < items.length; i++) {
  this.setData({ [`items[${i}]`]: items[i] })
}

// ✅ 正确：合并更新
this.setData({ items: items })

// ✅ 正确：局部更新
this.setData({ [`items[${index}].name`]: newName })
```

#### 列表优化

```xml
<!-- ✅ 图片懒加载 -->
<image src="{{item.image}}" lazy-load mode="aspectFill" />

<!-- ✅ 分页加载 -->
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

### 6. 安全规范

```javascript
// ✅ 加密存储敏感信息
const encrypted = encrypt(data, key)
wx.setStorageSync('sensitive_data', encrypted)

// ✅ XSS 防护
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// ✅ Token 鉴权
header['Authorization'] = `Bearer ${token}`
```

---

## 🎯 使用场景

### 场景 1: 开发新页面

```
你: 帮我创建一个用户列表页面，支持下拉刷新和上拉加载

Copilot: [自动加载微信小程序规范]
我将为你创建一个符合小程序规范的页面...

[生成符合规范的 Page 代码]
```

### 场景 2: 创建自定义组件

```
你: 创建一个用户卡片组件，接收用户信息 props

Copilot: [自动加载微信小程序规范]
根据规范，我将创建一个标准的 Component...

[生成符合规范的 Component 代码]
```

### 场景 3: 封装网络请求

```
你: 帮我封装一个统一的网络请求工具

Copilot: [自动加载微信小程序规范]
我将创建一个包含错误处理、Token 鉴权的请求封装...

[生成完整的 request.js]
```

### 场景 4: 性能优化

```
你: 检查这段代码的性能问题

Copilot: [自动加载微信小程序规范]
发现以下性能问题：
1. setData 调用过于频繁
2. 列表渲染缺少 key
3. 图片未使用懒加载

建议优化方案：...
```

---

## ✅ 检查清单

### 开发规范
- [ ] 文件组织遵循推荐结构
- [ ] 使用 kebab-case 命名文件
- [ ] 为复杂逻辑添加注释
- [ ] 所有异步操作有错误处理
- [ ] 操作结果有明确提示

### 性能优化
- [ ] setData 调用已优化
- [ ] 长列表使用分页或虚拟列表
- [ ] 图片使用懒加载
- [ ] 合理使用代码分包

### 安全规范
- [ ] 敏感信息加密存储
- [ ] 用户输入已转义
- [ ] 接口有 Token 验证
- [ ] 使用 HTTPS

### 用户体验
- [ ] 异步操作有 loading 提示
- [ ] 错误提示清晰
- [ ] 无数据时显示空状态
- [ ] 支持下拉刷新
- [ ] 长列表支持上拉加载

---

## 📚 相关资源

### 文档
- [微信小程序开发规范](../standards/frameworks/wechat-miniprogram.md) - 完整规范文档
- [微信小程序 Agent](../agents/wechat-miniprogram.agent.md) - Agent 配置
- [微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

### 测试
- 运行 `npm run test` 验证规范加载
- 使用 `test-miniprogram.cjs` 测试规范识别

---

## 🔄 更新日志

### v1.0.0 (2025-12-17)
- ✨ 首次发布微信小程序开发规范
- ✨ 支持 Page/Component 开发
- ✨ 支持网络请求、本地存储规范
- ✨ 支持性能优化、安全规范
- ✨ MCP 服务器自动识别支持

---

## 💡 最佳实践建议

1. **项目开始时**
   - 复制 `.github/copilot-instructions.md` 模板
   - 运行 MCP 工具生成项目配置

2. **开发过程中**
   - 使用 `@workspace` 让 Copilot 加载规范
   - 定期运行性能检查

3. **代码审查时**
   - 使用规范检查清单
   - 确保安全规范落实

4. **团队协作**
   - 共享 `.github/copilot-instructions.template.md`
   - 允许个人定制 `copilot-instructions.md`（添加到 .gitignore）

---

**维护团队**: MTA工作室  
**更新日期**: 2025-12-17
