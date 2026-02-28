// 设备状态相关工具函数
export const deviceStatus = {
  // 计算设备状态
  calculateDeviceStatus(device) {
    if (!device.is_enabled) {
      return 'offline'
    }
    // 这里可以根据实际业务逻辑扩展
    return 'online'
  },

  // 获取状态显示文本
  getStatusDisplayText(status) {
    const statusTexts = {
      online: '在线',
      offline: '离线',
      fault: '故障',
      disabled: '禁用',
      warning: '警告',
    }
    return statusTexts[status] || status || '未知'
  },

  // 获取状态对应的 CSS 类
  getStatusClass(status) {
    return `status-${status}`
  },
}

// 协议相关工具函数
export const protocolUtils = {
  // 获取协议显示名称
  getProtocolDisplayName(protocol) {
    if (!protocol) return '未知协议'

    const protocolName = protocol.toLowerCase()
    const protocolNames = {
      modbusrtu: 'ModbusRTU',
      modbustcp: 'ModbusTCP',
      mqtt: 'MQTT',
    }
    return protocolNames[protocolName] || protocol
  },

  // 将协议名称映射为筛选用的key
  mapProtocolToKey(protocolName) {
    const protocolMap = {
      modbusrtu: 'modbus',
      modbustcp: 'modbus',
      'modbus rtu': 'modbus',
      'modbus tcp': 'modbus',
      mqtt: 'mqtt',
    }

    if (!protocolName) return ''

    const lowerProtocol = protocolName.toLowerCase()
    return protocolMap[lowerProtocol] || lowerProtocol
  },
}

// 数据转换工具函数
export const dataTransform = {
  // 格式化设备数据（保留 rawData 供编辑时读取完整 protocol_type.config）
  formatDeviceItem(device) {
    return {
      id: device.id,
      model_id: device.model_id,
      name: device.device_name,
      code: device.device_code,
      template: device.model_name,
      protocol: device.protocol_type?.name || '',
      protocolDisplay: protocolUtils.getProtocolDisplayName(device.protocol_type?.name || ''),
      status: deviceStatus.calculateDeviceStatus(device),
      points: 0, // 需要从其他接口获取
      interval: device.scan_interval,
      createTime: this.formatCreateTime(device.created_at),
      rawData: device, // 原始接口数据，含 protocol_type.config，编辑时用于回填配置
    }
  },

  // 格式化创建时间
  formatCreateTime(createdAt) {
    return createdAt ? createdAt.split(' ')[0] : ''
  },
}

// 搜索筛选工具函数
export const searchUtils = {
  // 检查实例是否匹配搜索关键词
  instanceMatchesSearch(instance, keyword) {
    if (!keyword) return true

    const lowerKeyword = keyword.toLowerCase()

    const searchFields = [instance.code, instance.name, instance.protocolDisplay, instance.template]

    return searchFields.some((field) => field && field.toLowerCase().includes(lowerKeyword))
  },

  // 应用筛选条件
  applyFilters(instances, filters) {
    let filtered = [...instances]

    // 应用搜索关键词
    if (filters.searchKeyword.trim()) {
      const keyword = filters.searchKeyword.trim().toLowerCase()
      filtered = filtered.filter((instance) => this.instanceMatchesSearch(instance, keyword))
    }

    // 应用状态筛选
    if (filters.statusFilter) {
      filtered = filtered.filter((instance) => instance.status === filters.statusFilter)
    }

    // 应用协议筛选
    if (filters.protocolFilter) {
      filtered = filtered.filter((instance) => {
        const protocolKey = protocolUtils.mapProtocolToKey(instance.protocol)
        return protocolKey === filters.protocolFilter
      })
    }

    return filtered
  },
}
