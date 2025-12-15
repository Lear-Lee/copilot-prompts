#!/usr/bin/env node
/**
 * Phase 3 性能与缓存优化测试
 * 测试缓存机制、使用统计、性能监控
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

console.log('🚀 测试 Phase 3: 性能与缓存优化\n');

const transport = new StdioClientTransport({
  command: 'node',
  args: ['build/index.js'],
});

const client = new Client({
  name: 'test-client',
  version: '1.0.0',
}, {
  capabilities: {},
});

async function test() {
  await client.connect(transport);
  
  // 测试 1: 缓存效果 - 多次请求相同规范
  console.log('📋 测试 1: 缓存效果（连续3次请求相同规范）\n');
  
  const testContext = {
    fileType: 'vue',
    imports: ['vue', 'element-plus'],
    scenario: '表单组件'
  };
  
  console.log('第 1 次请求（冷启动，缓存未命中）...');
  await client.callTool({
    name: 'get_relevant_standards',
    arguments: testContext
  });
  
  console.log('第 2 次请求（应该从缓存读取）...');
  await client.callTool({
    name: 'get_relevant_standards',
    arguments: testContext
  });
  
  console.log('第 3 次请求（应该从缓存读取）...\n');
  await client.callTool({
    name: 'get_relevant_standards',
    arguments: testContext
  });
  
  // 测试 2: 不同场景（建立使用统计）
  console.log('📋 测试 2: 多场景使用（建立使用统计）\n');
  
  const scenarios = [
    { fileType: 'ts', imports: ['axios'], scenario: 'API 调用' },
    { fileType: 'vue', imports: ['pinia'], scenario: '状态管理' },
    { fileType: 'vue', imports: ['vue-i18n'], scenario: '国际化' },
    { fileType: 'vue', imports: ['vue', 'element-plus'], scenario: '表单组件' }, // 重复
  ];
  
  for (const scenario of scenarios) {
    console.log(`请求: ${scenario.scenario}...`);
    await client.callTool({
      name: 'get_relevant_standards',
      arguments: scenario
    });
  }
  
  console.log('');
  
  // 测试 3: 查看统计信息（不含缓存详情）
  console.log('📋 测试 3: 查看使用统计和性能指标\n');
  
  const stats = await client.callTool({
    name: 'get_standards_stats',
    arguments: { includeCache: false }
  });
  
  console.log('📊 统计信息:');
  console.log(JSON.stringify(JSON.parse(stats.content[0].text), null, 2).substring(0, 1000) + '...\n');
  
  // 测试 4: 查看缓存详情
  console.log('📋 测试 4: 查看缓存详细信息\n');
  
  const cacheStats = await client.callTool({
    name: 'get_standards_stats',
    arguments: { includeCache: true }
  });
  
  const cacheData = JSON.parse(cacheStats.content[0].text);
  
  console.log('💾 缓存状态:');
  console.log(`- 缓存大小: ${cacheData.cache.size}/${cacheData.cache.maxSize}`);
  console.log(`- 缓存命中率: ${cacheData.performance.cacheHitRate}`);
  console.log(`- 平均响应时间: ${cacheData.summary.averageResponseTime}`);
  console.log(`- Token 节省总计: ${cacheData.performance.totalTokensSaved}`);
  
  console.log('\n🔥 热门规范:');
  cacheData.usage.topStandards.forEach((item, index) => {
    console.log(`${index + 1}. ${item.standard} - 使用 ${item.count} 次`);
  });
  
  console.log('\n🎯 常用组合:');
  cacheData.usage.topCombinations.slice(0, 3).forEach((item, index) => {
    const standards = item.combination.split('|').map(s => s.split('/').pop());
    console.log(`${index + 1}. ${standards.join(' + ')} - ${item.count} 次`);
  });
  
  console.log('\n✅ Phase 3 测试完成！');
  
  await client.close();
  process.exit(0);
}

test().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
