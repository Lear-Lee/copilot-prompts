#!/usr/bin/env node

/**
 * 测试微信小程序规范加载
 */

const path = require('path');
const buildPath = path.join(__dirname, 'build');
const { StandardsManager } = require(path.join(buildPath, 'core/standardsManager.js'));

const manager = new StandardsManager();

console.log('=== 测试微信小程序规范 ===\n');

// 测试 1: 通过文件类型检测
console.log('测试 1: WXML 文件类型');
const test1 = manager.getRelevantStandards({
  fileType: 'wxml'
});
console.log('匹配的规范:', test1);
console.log('');

// 测试 2: 通过导入检测
console.log('测试 2: 检测 wx 导入');
const test2 = manager.getRelevantStandards({
  fileType: 'js',
  imports: ['wx']
});
console.log('匹配的规范:', test2);
console.log('');

// 测试 3: 通过场景检测
console.log('测试 3: 小程序页面开发场景');
const test3 = manager.getRelevantStandards({
  scenario: '小程序页面开发'
});
console.log('匹配的规范:', test3);
console.log('');

// 测试 4: 通过文件内容检测
console.log('测试 4: 检测小程序代码内容');
const test4 = manager.getRelevantStandards({
  fileType: 'js',
  fileContent: `
    Page({
      data: {
        list: []
      },
      onLoad() {
        this.fetchData()
      },
      fetchData() {
        wx.request({
          url: '/api/data',
          success: (res) => {
            this.setData({
              list: res.data
            })
          }
        })
      }
    })
  `
});
console.log('匹配的规范:', test4);
console.log('');

// 测试 5: 读取微信小程序规范内容
console.log('测试 5: 读取规范内容');
try {
  const content = manager.readStandard('standards://frameworks/wechat-miniprogram');
  console.log('规范内容长度:', content.length, '字符');
  console.log('前 200 字符:', content.substring(0, 200) + '...');
  console.log('');
} catch (error) {
  console.error('读取规范失败:', error.message);
}

// 测试 6: 获取所有可用规范（检查是否包含微信小程序）
console.log('测试 6: 检查可用规范列表');
const availableStandards = manager.getAvailableStandards();
const miniProgramStandard = availableStandards.find(s => 
  s.uri.includes('wechat-miniprogram')
);
if (miniProgramStandard) {
  console.log('✅ 找到微信小程序规范:');
  console.log('  URI:', miniProgramStandard.uri);
  console.log('  名称:', miniProgramStandard.name);
  console.log('  描述:', miniProgramStandard.description);
} else {
  console.log('❌ 未找到微信小程序规范');
}

console.log('\n=== 测试完成 ===');
