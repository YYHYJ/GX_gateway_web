import request from '@/utils/request'

// 根据协议类型获取对应的API配置
const protocolApiMap = {
  'Modbus RTU': '/api/device/model_detail_modbus_rtu',
  'Modbus TCP': '/api/device/model_detail_modbus_tcp',
  MQTT: '/api/device/model_detail_mqtt',
  OPCUA: '/api/device/model_detail_opcua',
  'IEC-61850': '/api/device/model_detail_iec61850',
  CAN: '/api/device/model_detail_can',
  RS232: '/api/device/model_detail_rs232',
  RS485: '/api/device/model_detail_rs485',
}

/**
 * 根据协议类型获取通信规约详情
 * @param {Object} queryParams - 查询参数
 * @param {string} protocolType - 协议类型
 * @returns {Promise} API响应
 */
export function getCommunicationSpec(queryParams, protocolType = 'Modbus RTU') {
  const apiUrl = protocolApiMap[protocolType] || '/api/device/model_detail_modbus1'

  return request({
    url: apiUrl,
    method: 'POST',
    data: queryParams,
  })
}

// /**
//  * 获取Modbus RTU配置详情（POST方式）
//  * @param {Object} queryParams - 查询参数
//  * @param {number|string} queryParams.model_id - 设备模板ID
//  * @param {number} queryParams.size - 每页大小
//  * @param {number} queryParams.current - 当前页码
//  * @param {number} queryParams.start_address - 起始地址
//  * @returns {Promise} API响应
//  */
// export function getModbusRTUConfig(queryParams) {
//   return request({
//     url: '/api/device/model_detail_modbus_rtu',
//     method: 'POST',
//     data: queryParams,
//   })
// }

// /**
//  * 获取Modbus TCP配置详情（POST方式）
//  * @param {Object} queryParams - 查询参数
//  * @param {number|string} queryParams.model_id - 设备模板ID
//  * @param {number} queryParams.size - 每页大小
//  * @param {number} queryParams.current - 当前页码
//  * @param {number} queryParams.start_address - 起始地址
//  * @returns {Promise} API响应
//  */
// export function getModbusTCPConfig(queryParams) {
//   return request({
//     url: '/api/device/model_detail_modbus_tcp',
//     method: 'POST',
//     data: queryParams,
//   })
// }

// /**
//  * 获取MQTT配置详情（POST方式）
//  * @param {Object} queryParams - 查询参数
//  * @param {number|string} queryParams.model_id - 设备模板ID
//  * @param {number} queryParams.size - 每页大小
//  * @param {number} queryParams.current - 当前页码
//  * @returns {Promise} API响应
//  */
// export function getMQTTConfig(queryParams) {
//   return request({
//     url: '/api/device/model_detail_mqtt',
//     method: 'POST',
//     data: queryParams,
//   })
// }

// /**
//  * 保存通信规约配置（通用保存接口）
//  * @param {Object} saveParams - 保存参数
//  * @param {number|string} saveParams.model_id - 设备模板ID
//  * @param {Object} saveParams.config - 配置数据
//  * @returns {Promise} API响应
//  */
// export function saveCommunicationConfig(saveParams) {
//   return request({
//     url: '/api/device/model_config_save',
//     method: 'POST',
//     data: saveParams,
//   })
// }

// /**
//  * 测试通信连接
//  * @param {Object} testParams - 测试参数
//  * @param {number|string} testParams.model_id - 设备模板ID
//  * @param {Object} testParams.test_config - 测试配置
//  * @returns {Promise} API响应
//  */
// export function testCommunication(testParams) {
//   return request({
//     url: '/api/device/communication_test',
//     method: 'POST',
//     data: testParams,
//   })
// }

// /**
//  * 根据协议类型获取配置详情
//  * @param {string} protocolType - 协议类型
//  * @param {Object} queryParams - 查询参数
//  * @returns {Promise} API响应
//  */
// export function getProtocolConfig(protocolType, queryParams) {
//   const protocolApiMap = {
//     'Modbus RTU': '/api/device/model_detail_modbus_rtu',
//     'Modbus TCP': '/api/device/model_detail_modbus_tcp',
//     MQTT: '/api/device/model_detail_mqtt',
//     OPCUA: '/api/device/model_detail_opcua',
//     'IEC-61850': '/api/device/model_detail_iec61850',
//     CAN: '/api/device/model_detail_can',
//     RS232: '/api/device/model_detail_rs232',
//     RS485: '/api/device/model_detail_rs485',
//   }

//   const apiUrl = protocolApiMap[protocolType] || '/api/device/model_detail_general'

//   return request({
//     url: apiUrl,
//     method: 'POST',
//     data: queryParams,
//   })
// }
