#!/usr/bin/env node

/**
 * 测试 MCP Standards Resources 功能
 */

const { spawn } = require('child_process');
const path = require('path');

const mcpServerPath = path.resolve(__dirname, 'build/index.js');

console.log('🚀 测试 MCP Standards Resources 功能\n');

// 启动 MCP 服务器
const server = spawn('node', [mcpServerPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let testCounter = 0;

// 监听输出
server.stdout.on('data', (data) => {
  console.log('📤 响应:', data.toString().substring(0, 500) + '...\n');
});

server.stderr.on('data', (data) => {
  console.log('📝 日志:', data.toString());
});

server.on('error', (error) => {
  console.error('❌ 错误:', error);
});

// 测试 1: 列出所有资源
setTimeout(() => {
  console.log('\n📋 测试 1: 列出所有编码规范资源\n');
  
  const listResourcesRequest = {
    jsonrpc: '2.0',
    id: ++testCounter,
    method: 'resources/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
}, 1000);

// 测试 2: 读取特定资源
setTimeout(() => {
  console.log('\n📖 测试 2: 读取 Vue 3 Composition API 规范\n');
  
  const readResourceRequest = {
    jsonrpc: '2.0',
    id: ++testCounter,
    method: 'resources/read',
    params: {
      uri: 'standards://frameworks/vue3-composition'
    }
  };
  
  server.stdin.write(JSON.stringify(readResourceRequest) + '\n');
}, 3000);

// 测试 3: 获取相关规范（Vue 3 + Pinia + Element Plus）
setTimeout(() => {
  console.log('\n🎯 测试 3: 获取 Vue 3 + Pinia + Element Plus 相关规范\n');
  
  const getStandardsRequest = {
    jsonrpc: '2.0',
    id: ++testCounter,
    method: 'tools/call',
    params: {
      name: 'get_relevant_standards',
      arguments: {
        fileType: 'vue',
        imports: ['vue', 'pinia', 'element-plus'],
        scenario: '创建表单组件'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(getStandardsRequest) + '\n');
}, 5000);

// 测试 4: 获取 API 相关规范
setTimeout(() => {
  console.log('\n🌐 测试 4: 获取 API 层设计规范\n');
  
  const getApiStandardsRequest = {
    jsonrpc: '2.0',
    id: ++testCounter,
    method: 'tools/call',
    params: {
      name: 'get_relevant_standards',
      arguments: {
        fileType: 'ts',
        imports: ['axios'],
        scenario: 'API 调用'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(getApiStandardsRequest) + '\n');
}, 7000);

// 9 秒后退出
setTimeout(() => {
  console.log('\n✅ 测试完成，关闭服务器...');
  server.kill();
  process.exit(0);
}, 9000);
