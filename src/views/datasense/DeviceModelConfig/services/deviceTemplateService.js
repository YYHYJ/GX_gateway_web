// API调用服务层
const deviceTemplateService = {
  // 获取协议类型列表
  async getProtocolTypes() {
    try {
      const response = await fetch('/api/device/protocols')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.code === 200) {
        return data.data
      } else {
        throw new Error(data.message || '获取协议类型失败')
      }
    } catch (error) {
      console.error('获取协议类型失败:', error)
      throw error
    }
  },

  // 获取设备模板列表
  async getDeviceTemplates() {
    try {
      const response = await fetch('/api/device/modelConfig')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('获取设备模板失败:', error)
      throw error
    }
  },

  // 删除模板
  async deleteDeviceTemplate(id) {
    try {
      const deleteData = {
        ids: [Number(id)],
      }

      const response = await fetch('/api/device/modelConfig', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('删除模板失败:', error)
      throw error
    }
  },

  // 创建模板
  async createDeviceTemplate(data) {
    try {
      const response = await fetch('/api/device/modelConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('创建设备模板失败:', error)
      throw error
    }
  },

  // 编辑模板
  async updateDeviceTemplate(id, data) {
    try {
      const updateData = {
        updates: [
          {
            id: Number(id),
            model_name: data.model_name,
            manufacturer: data.manufacturer,
            protocol_type: data.protocol_type,
            description: data.description,
          },
        ],
      }

      const response = await fetch('/api/device/modelConfig', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('更新模板失败:', error)
      throw error
    }
  },
}

export default deviceTemplateService
