#!/usr/bin/env node

/**
 * 微信小程序云开发相关功能测试
 * 测试 StandardsManager 对云开发关键词的识别能力
 */

const { StandardsManager } = require('./build/core/standardsManager.js');

const manager = new StandardsManager();

console.log('🧪 微信小程序云开发功能测试\n');
console.log('=' .repeat(60));

// 测试计数器
let passed = 0;
let failed = 0;

/**
 * 测试辅助函数
 */
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    failed++;
  }
}

// 测试1: 云函数场景检测
test('云函数场景检测', () => {
  const result = manager.getRelevantStandards({ scenario: '云函数开发' });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试2: 云数据库场景检测
test('云数据库场景检测', () => {
  const result = manager.getRelevantStandards({ scenario: '云数据库操作' });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试3: 云存储场景检测
test('云存储场景检测', () => {
  const result = manager.getRelevantStandards({ scenario: '云存储管理' });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试4: wx.cloud API 调用检测
test('wx.cloud API 调用检测', () => {
  const result = manager.getRelevantStandards({
    fileContent: `
      wx.cloud.callFunction({
        name: 'getUserInfo',
        data: { userId: '123' }
      })
    `
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试5: 云函数代码内容检测
test('云函数代码内容检测', () => {
  const result = manager.getRelevantStandards({
    fileContent: `
      const cloud = require('wx-server-sdk')
      cloud.init()
      
      exports.main = async (event, context) => {
        const db = cloud.database()
        return await db.collection('users').get()
      }
    `
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试6: 云数据库操作代码检测
test('云数据库操作代码检测', () => {
  const result = manager.getRelevantStandards({
    fileContent: `
      const db = wx.cloud.database()
      const users = await db.collection('users')
        .where({ status: 'active' })
        .get()
    `
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试7: 云存储上传代码检测
test('云存储上传代码检测', () => {
  const result = manager.getRelevantStandards({
    fileContent: `
      wx.cloud.uploadFile({
        cloudPath: 'images/avatar.jpg',
        filePath: tempFilePath
      })
    `
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试8: 组合检测 - 场景 + 导入
test('组合检测 - 云开发场景 + wx 导入', () => {
  const result = manager.getRelevantStandards({
    scenario: '云函数开发',
    imports: ['wx']
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试9: 组合检测 - 文件类型 + 内容
test('组合检测 - .js 文件 + wx.cloud 内容', () => {
  const result = manager.getRelevantStandards({
    fileType: 'js',
    fileContent: 'wx.cloud.init({ env: "prod" })'
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

// 测试10: callFunction 关键词检测
test('callFunction 关键词检测', () => {
  const result = manager.getRelevantStandards({
    fileContent: 'const res = await callFunction({ name: "login" })'
  });
  if (!result.includes('standards://frameworks/wechat-miniprogram')) {
    throw new Error('未检测到微信小程序规范');
  }
});

console.log('=' .repeat(60));
console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败\n`);

if (failed > 0) {
  process.exit(1);
}
