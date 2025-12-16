<template>
  <MainLayout active-nav="data" user-name="管理员">
    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 使用 PageHeader 组件 -->
      <PageHeader :title="pageTitle" :breadcrumbs="breadcrumbs" :actions="pageActions" />

      <!-- 加载状态 -->
      <div v-if="loadingProtocol" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载 {{ protocolDisplayName }} 配置...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadProtocolComponent">
          <i class="fas fa-redo"></i> 重新加载
        </button>
      </div>

      <!-- 动态加载协议组件 -->
      <div v-else>
        <component
          :is="currentProtocolComponent"
          v-if="currentProtocolComponent"
          :template-id="templateId"
          :template-data="templateData"
          @save="handleSave"
          @test="handleTest"
        />
        <div v-else class="no-protocol">
          <i class="fas fa-exclamation-circle"></i>
          <h3>暂不支持该协议类型</h3>
          <p>当前暂不支持 {{ protocolDisplayName }} 协议配置</p>
          <p class="debug-info">
            协议类型: {{ protocolType }}<br />
            显示名称: {{ protocolDisplayName }}
          </p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import {
  getProtocolDisplayName,
  getProtocolIcon,
  isValidProtocol,
} from '../services/protocolService'

// 协议组件映射（保持不变）
const ProtocolComponents = {
  ModbusTCP: () => import('../components/protocol/ModbusProtocol.vue'),
  'Modbus RTU': () => import('../components/protocol/ModbusProtocol.vue'),
}

// 默认协议组件（保持不变）
const DefaultProtocolComponent = () => ({
  template: `
    <div class="default-protocol-config">
      <div class="config-card">
        <div class="config-header">
          <h3><i class="fas fa-cogs"></i> {{ protocolDisplayName }} 配置</h3>
          <p class="config-description">
            这是一个通用协议配置界面
          </p>
        </div>
        <div class="config-body">
          <div class="config-section">
            <h4>当前协议类型: {{ protocolType }}</h4>
            <p>暂不支持该协议的详细配置，请使用通用配置</p>
            <div class="form-group">
              <label>服务器地址</label>
              <input type="text" v-model="config.server" placeholder="请输入服务器地址">
            </div>
            <div class="form-group">
              <label>端口号</label>
              <input type="number" v-model="config.port" placeholder="请输入端口号">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    templateId: [String, Number],
    templateData: Object,
  },
  data() {
    return {
      config: {
        server: '',
        port: '',
      },
      protocolType: this.templateData?.protocol_type || '',
      protocolDisplayName: '',
    }
  },
  mounted() {
    this.protocolDisplayName = getProtocolDisplayName(this.protocolType) || this.protocolType
  },
  methods: {
    save() {
      this.$emit('save', {
        protocolType: this.protocolType,
        config: this.config,
      })
    },
    test() {
      this.$emit('test', this.config)
    },
  },
})

export default {
  name: 'CommunicationSpec',
  components: {
    MainLayout,
    PageHeader,
  },
  data() {
    return {
      templateId: null,
      templateName: '',
      templateData: {},
      protocolType: '',
      protocolDisplayName: '',
      protocolIcon: '',
      loadingProtocol: false,
      error: '',
      currentProtocolComponent: null,
      breadcrumbs: [
        { title: '数据采集', link: '/data/protocol-overview' },
        { title: '设备模板', link: '/data/device/modelConfig' },
        { title: '通信规约' }, // 初始值，会在 created 中更新
      ],
      pageActions: [
        {
          text: '返回',
          icon: 'fas fa-arrow-left',
          type: 'outline',
          handler: this.goBack,
        },
      ],
    }
  },
  computed: {
    pageTitle() {
      return `${this.protocolDisplayName} - ${this.templateName || '加载中...'}`
    },
  },
  created() {
    console.log('CommunicationSpec created')
    console.log('Route params:', this.$route.params)
    console.log('Route query:', this.$route.query)

    // 获取模板ID
    this.templateId = this.$route.params.templateId || this.$route.query.templateId

    // 获取协议类型
    this.protocolType = this.$route.query.protocol || ''

    console.log('templateId:', this.templateId)
    console.log('原始protocolType:', this.protocolType)

    if (!this.protocolType) {
      this.error = '无法确定协议类型'
      console.error('协议类型为空')
      return
    }

    if (!this.templateId) {
      this.error = '无法确定设备模板'
      console.error('模板ID为空')
      return
    }

    // 验证协议类型
    if (!isValidProtocol(this.protocolType)) {
      console.warn(`协议类型 "${this.protocolType}" 不在支持列表中`)
    }

    // 加载协议组件
    this.loadProtocolComponent()
  },
  methods: {
    // 加载协议组件
    async loadProtocolComponent() {
      console.log('开始加载协议组件...')

      this.loadingProtocol = true
      this.error = ''
      this.currentProtocolComponent = null

      try {
        // 设置协议显示信息
        this.protocolDisplayName = getProtocolDisplayName(this.protocolType)
        this.protocolIcon = getProtocolIcon(this.protocolType)

        console.log('协议显示名称:', this.protocolDisplayName)
        console.log('协议图标:', this.protocolIcon)

        // 更新面包屑
        this.updateBreadcrumb()

        // 获取模板基本信息
        await this.loadTemplateInfo()

        // 根据协议类型决定使用哪个组件加载器
        let componentLoader = null

        // 优先使用协议类型作为键
        if (ProtocolComponents[this.protocolType]) {
          componentLoader = ProtocolComponents[this.protocolType]
          console.log('使用原始协议类型作为键:', this.protocolType)
        }
        // 如果没有找到，尝试使用显示名称
        else if (ProtocolComponents[this.protocolDisplayName]) {
          componentLoader = ProtocolComponents[this.protocolDisplayName]
          console.log('使用显示名称作为键:', this.protocolDisplayName)
        }
        // 尝试一些常见的变体
        else {
          // 对于 ModbusTCP，也尝试 Modbus TCP 格式
          if (this.protocolType === 'ModbusTCP' && ProtocolComponents['Modbus TCP']) {
            componentLoader = ProtocolComponents['Modbus TCP']
            console.log('使用变体键: Modbus TCP')
          }
          // 对于 ModbusRTU，也尝试 Modbus RTU 格式
          else if (this.protocolType === 'ModbusRTU' && ProtocolComponents['Modbus RTU']) {
            componentLoader = ProtocolComponents['Modbus RTU']
            console.log('使用变体键: Modbus RTU')
          }
        }

        if (componentLoader) {
          try {
            console.log('开始加载协议组件...')
            const component = await componentLoader()
            this.currentProtocolComponent = component.default || component
            console.log('组件加载成功:', this.currentProtocolComponent)
          } catch (err) {
            console.error('加载协议组件失败:', err)
            console.log('动态加载失败，使用默认组件')
            this.currentProtocolComponent = DefaultProtocolComponent
            this.error = `无法加载 ${this.protocolDisplayName} 协议组件，使用通用配置`
          }
        } else {
          console.warn(`没有找到 ${this.protocolType} 对应的组件加载器`)
          console.log('使用默认组件')
          this.currentProtocolComponent = DefaultProtocolComponent
        }
      } catch (err) {
        console.error('加载协议配置失败:', err)
        this.error = err.message || '加载协议配置失败'
        this.currentProtocolComponent = DefaultProtocolComponent
      } finally {
        this.loadingProtocol = false
        console.log('加载完成，currentProtocolComponent:', this.currentProtocolComponent)
      }
    },

    // 更新面包屑
    updateBreadcrumb() {
      this.breadcrumbs = [
        { title: '数据采集', link: '/data/protocol-overview' },
        { title: '设备模板', link: '/data/device/modelConfig' },
        { title: `${this.templateName || '加载中...'} - ${this.protocolDisplayName} 通信规约` },
      ]
    },

    // 加载模板信息
    async loadTemplateInfo() {
      try {
        console.log('加载模板信息，templateId:', this.templateId)

        // 这里应该调用API获取模板信息
        // 暂时使用模拟数据
        this.templateData = {
          id: this.templateId,
          model_name: '智能温控器-T1000',
          manufacturer: '示例厂商',
          protocol_type: this.protocolType,
        }
        this.templateName = this.templateData.model_name

        // 模拟API调用延迟
        await new Promise((resolve) => setTimeout(resolve, 300))

        console.log('模板信息加载完成:', this.templateData)

        // 更新面包屑
        this.updateBreadcrumb()
      } catch (err) {
        console.error('加载模板信息失败:', err)
        this.templateName = '未知设备模板'
        this.templateData = {
          id: this.templateId,
          model_name: '未知设备',
          protocol_type: this.protocolType,
        }
        this.updateBreadcrumb()
      }
    },

    // 处理保存
    handleSave(config) {
      console.log('保存配置:', config)
      this.$message.success('配置保存成功')
    },

    // 处理测试
    handleTest(config) {
      console.log('测试配置:', config)
      this.$message.success('连接测试成功')
    },

    // 导航方法
    goBack() {
      this.$router.push('/data/device/modelConfig')
    },
  },
  watch: {
    '$route.params.templateId': {
      handler(newTemplateId) {
        console.log('templateId变化:', newTemplateId)
        if (newTemplateId && newTemplateId !== this.templateId) {
          this.templateId = newTemplateId
          this.loadProtocolComponent()
        }
      },
    },
    '$route.query.protocol': {
      handler(newProtocol) {
        console.log('protocol变化:', newProtocol)
        if (newProtocol && newProtocol !== this.protocolType) {
          this.protocolType = newProtocol
          this.loadProtocolComponent()
        }
      },
    },
  },
}
</script>

<style scoped>
.loading-state,
.error-state,
.no-protocol {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.error-state i {
  font-size: 48px;
  color: #e74c3c;
  margin-bottom: 15px;
}

.error-state h3 {
  margin-bottom: 10px;
  color: #e74c3c;
}

.no-protocol i {
  font-size: 48px;
  color: #f39c12;
  margin-bottom: 15px;
}

.no-protocol h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.no-protocol p {
  color: #7f8c8d;
  margin-bottom: 10px;
}

.debug-info {
  font-size: 12px;
  color: #95a5a6;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  text-align: left;
}

/* 默认协议组件的样式 */
.default-protocol-config {
  .config-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 20px;
  }

  .config-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa;
  }

  .config-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .config-description {
    color: #95a5a6;
    font-size: 14px;
    margin: 0;
  }

  .config-body {
    padding: 20px;
  }

  .config-section {
    margin-bottom: 20px;
  }

  .config-section h4 {
    font-size: 16px;
    color: #3498db;
    margin-bottom: 15px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #34495e;
  }

  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3498db;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
