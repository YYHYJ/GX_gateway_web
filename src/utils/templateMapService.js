/**
 * 设备模板映射服务 - 可复用的模板名称获取工具
 */
import { getDeviceTemplates } from '@/api/deviceTemplate'

class TemplateMapService {
  constructor() {
    this.templateMap = {}
    this.loading = false
    this.loaded = false
  }

  // 加载模板映射
  async loadTemplates() {
    if (this.loaded || this.loading) {
      return this.templateMap
    }

    this.loading = true
    try {
      const response = await getDeviceTemplates()
      if (response.code === 200 && response.data) {
        this.templateMap = response.data.reduce((map, template) => {
          map[template.id] = template.model_name
          return map
        }, {})
        this.loaded = true
      }
    } catch (error) {
      console.error('加载模板映射失败:', error)
    } finally {
      this.loading = false
    }
    return this.templateMap
  }

  // 根据模板ID获取模板名称
  getTemplateName(templateId) {
    return this.templateMap[templateId] || '未知模板'
  }

  // 获取所有模板映射
  getTemplateMap() {
    return this.templateMap
  }

  // 清除缓存
  clearCache() {
    this.templateMap = {}
    this.loaded = false
  }
}

// 导出单例
export default new TemplateMapService()
