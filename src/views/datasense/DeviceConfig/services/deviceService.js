import axios from 'axios'
import messageService from '@/utils/message'
// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const deviceService = {
  // 获取设备实例列表
  async getDeviceInstances() {
    try {
      const response = await apiClient.get('/device/config')
      return response.data
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  // 获取单个设备详情
  async getDeviceDetail(deviceId) {
    try {
      const response = await apiClient.get(`/device/config/${deviceId}`)
      return response.data
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  // 处理设备数据
  processDeviceData(data) {
    const processed = { ...data }

    // 转换 model_id 为数字
    if (processed.model_id) {
      processed.model_id = Number(processed.model_id)
    }

    // 转换其他数字字段
    if (processed.scan_interval) {
      processed.scan_interval = Number(processed.scan_interval)
    }

    // 确保协议配置存在
    if (!processed.protocol_type) {
      processed.protocol_type = { name: '', config: {} }
    }

    return processed
  },

  // 创建设备实例
  async createDeviceInstance(deviceData) {
    try {
      const processedData = this.processDeviceData(deviceData)
      const response = await apiClient.post('/device/config', processedData)
      // 统一处理成功响应
      if (response.data.code === 200) {
        messageService.success('设备创建成功')
        return response.data // 返回数据供调用方使用
      } else {
        // 处理业务逻辑错误
        throw new Error(response.data.message || '创建设备失败')
      }
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  // 更新设备实例
  async updateDeviceInstance(deviceData) {
    try {
      // 确保有设备ID
      if (!deviceData.id) {
        throw new Error('设备ID不能为空')
      }

      const processedData = this.processDeviceData(deviceData)
      const response = await apiClient.put('/device/config', processedData)

      if (response.data.code === 200) {
        messageService.success('设备更新成功')
        return response.data
      } else {
        throw new Error(response.data.message || '更新设备失败')
      }
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  // 删除单个设备
  async deleteDevice(deviceId) {
    return this.batchDeleteDevices([deviceId])
  },

  // 批量删除设备
  async batchDeleteDevices(deviceIds) {
    try {
      const response = await apiClient.delete('/device/config', {
        data: { ids: deviceIds },
      })

      if (response.data.code === 200) {
        const count = deviceIds.length
        messageService.success(`成功删除 ${count} 个设备`)
        return response.data
      } else {
        throw new Error(response.data.message || '删除设备失败')
      }
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  // 获取模板列表
  async getDeviceTemplates() {
    try {
      const response = await apiClient.get('/device/modelConfig')
      return response.data
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  // 获取协议类型列表
  async getProtocolTypes() {
    try {
      const response = await apiClient.get('/device/protocols')
      return response.data
    } catch (error) {
      throw this.handleApiError(error)
    }
  },

  handleApiError(error) {
    let userMessage = ''

    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.response.statusText

      // 处理 409 冲突错误
      if (status === 409) {
        if (message && message.includes('device_name')) {
          userMessage = '设备名称已存在，请使用其他名称'
          // 显示错误提示
          messageService.error(userMessage)
        } else if (message && message.includes('device_code')) {
          userMessage = '设备代码已存在，请使用其他代码'
          messageService.error(userMessage)
        } else {
          userMessage = message || '数据已存在，请修改后重试'
          messageService.error(userMessage)
        }
      } else {
        // 其他错误处理
        const errorMap = {
          400: `请求错误: ${message}`,
          401: '未授权，请重新登录',
          403: '没有访问权限',
          404: '接口不存在',
          500: '服务器内部错误',
        }

        userMessage = errorMap[status] || `请求失败 (${status}): ${message}`

        // 根据错误类型显示不同级别的提示
        if (status >= 500) {
          messageService.error(userMessage)
        } else if (status >= 400) {
          messageService.warning(userMessage)
        }
      }
    } else if (error.request) {
      userMessage = '网络错误，请检查网络连接'
      messageService.error(userMessage)
    } else {
      userMessage = `请求设置错误: ${error.message}`
      messageService.error(userMessage)
    }

    // 返回错误对象供调用方处理
    return new Error(userMessage)
  },
}
