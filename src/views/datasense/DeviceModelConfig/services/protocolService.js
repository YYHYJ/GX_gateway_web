// 协议类型工具函数 - 纯前端数据处理

// 协议显示名称映射（从你的主组件中提取）
const protocolDisplayNames = {
  CAN: 'CAN总线',
  'IEC-61850': 'IEC 61850',
  MQTT: 'MQTT',
  ModbusRTU: 'Modbus RTU',
  ModbusTCP: 'Modbus TCP',
  OPCUA: 'OPC UA',
  RS232: 'RS232',
  RS485: 'RS485',
  HTTP: 'HTTP',
  CoAP: 'CoAP',
  WebSocket: 'WebSocket',
}

// 协议图标映射（从你的主组件中提取）
const protocolIcons = {
  ModbusTCP: 'fas fa-network-wired',
  ModbusRTU: 'fas fa-plug',
  MQTT: 'fas fa-satellite-dish',
  CAN: 'fas fa-bus',
  OPCUA: 'fas fa-industry',
  HTTP: 'fas fa-globe',
  CoAP: 'fas fa-wifi',
  WebSocket: 'fas fa-bolt',
  'IEC-61850': 'fas fa-bolt',
  RS232: 'fas fa-exchange-alt',
  RS485: 'fas fa-project-diagram',
}

// 主函数：获取协议显示名称
export const getProtocolDisplayName = (protocolType) => {
  return protocolDisplayNames[protocolType] || protocolType || '--'
}

// 辅助函数：获取协议图标
export const getProtocolIcon = (protocolType) => {
  return protocolIcons[protocolType] || 'fas fa-question-circle'
}

// 获取所有支持的协议类型（用于下拉列表等）
export const getAllProtocolTypes = () => {
  return Object.keys(protocolDisplayNames)
}

// 验证协议类型是否有效
export const isValidProtocol = (protocolType) => {
  return protocolType in protocolDisplayNames
}

// 可选：导出整个对象（如果你喜欢面向对象的方式）
const protocolService = {
  getProtocolDisplayName,
  getProtocolIcon,
  getAllProtocolTypes,
  isValidProtocol,
  displayNames: protocolDisplayNames,
  icons: protocolIcons,
}

export default protocolService
