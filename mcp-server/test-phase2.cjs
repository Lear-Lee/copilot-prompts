#!/usr/bin/env node
/**
 * Phase 2 增强功能测试
 * 测试文件内容检测、自动导入分析、权重匹配算法
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

console.log('🚀 测试 Phase 2: 增强上下文分析\n');

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
  
  // 测试 1: 自动检测 imports（提供文件内容）
  console.log('📋 测试 1: 自动检测 Vue 组件的 imports\n');
  const vueFileContent = `
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const count = ref(0)
</script>
  `;
  
  const result1 = await client.callTool({
    name: 'get_relevant_standards',
    arguments: {
      fileType: 'vue',
      fileContent: vueFileContent
    }
  });
  console.log('📤 响应:', JSON.stringify(result1, null, 2).substring(0, 500) + '...\n');
  
  // 测试 2: 权重算法 - API 层开发（多个信号）
  console.log('📋 测试 2: API 层开发（场景 + 文件内容 + imports）\n');
  const apiFileContent = `
import axios from 'axios'
import type { AxiosInstance } from 'axios'

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

instance.interceptors.request.use(config => {
  return config
})
  `;
  
  const result2 = await client.callTool({
    name: 'get_relevant_standards',
    arguments: {
      fileType: 'ts',
      scenario: 'API 请求封装',
      fileContent: apiFileContent
    }
  });
  console.log('📤 响应:', JSON.stringify(result2, null, 2).substring(0, 500) + '...\n');
  
  // 测试 3: 复杂场景 - 表单组件（多技术栈）
  console.log('📋 测试 3: 表单组件（Vue + Pinia + Element Plus + i18n）\n');
  const formContent = `
<script setup lang="ts">
import { ref } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useFormStore } from '@/stores/form'

const { t } = useI18n()
const formStore = useFormStore()
const formRef = ref<FormInstance>()

const rules: FormRules = {
  username: [{ required: true, message: t('form.required') }]
}
</script>
  `;
  
  const result3 = await client.callTool({
    name: 'get_relevant_standards',
    arguments: {
      fileType: 'vue',
      scenario: '创建表单组件',
      fileContent: formContent
    }
  });
  console.log('📤 响应:', JSON.stringify(result3, null, 2).substring(0, 800) + '...\n');
  
  // 测试 4: 对比 - 只提供 imports vs 提供完整内容
  console.log('📋 测试 4: 对比测试（仅 imports vs 完整内容）\n');
  
  const result4a = await client.callTool({
    name: 'get_relevant_standards',
    arguments: {
      fileType: 'vue',
      imports: ['vue', 'pinia']
    }
  });
  
  const result4b = await client.callTool({
    name: 'get_relevant_standards',
    arguments: {
      fileType: 'vue',
      fileContent: `
import { ref } from 'vue'
import { defineStore } from 'pinia'

const useStore = defineStore('main', () => {
  const state = ref({})
  return { state }
})
      `
    }
  });
  
  console.log('仅 imports:', JSON.stringify(result4a, null, 2).substring(0, 300));
  console.log('\n完整内容:', JSON.stringify(result4b, null, 2).substring(0, 300) + '\n');
  
  console.log('✅ Phase 2 测试完成！');
  
  await client.close();
  process.exit(0);
}

test().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
