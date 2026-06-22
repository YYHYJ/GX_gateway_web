import request from '@/utils/request'

/**
 * 获取所有系统变量
 * @returns {Promise} 系统变量列表
 */
export function getSysVars() {
  return request({
    url: '/api/sysvars',
    method: 'get',
  })
}

/**
 * 创建系统变量
 * @param {Object} data - 变量数据
 * @param {string} data.var_name - 变量名
 * @param {string} data.var_value - 变量值
 * @param {string} data.var_type - 变量类型(string/int/float/bool)
 * @param {string} [data.description] - 描述
 * @returns {Promise}
 */
export function createSysVar(data) {
  return request({
    url: '/api/sysvars',
    method: 'post',
    data,
  })
}

/**
 * 更新系统变量
 * @param {Object} data - 变量数据
 * @param {number} data.id - 变量ID
 * @param {string} data.var_value - 变量值
 * @param {string} [data.description] - 描述
 * @returns {Promise}
 */
export function updateSysVar(data) {
  return request({
    url: '/api/sysvars',
    method: 'put',
    data,
  })
}

/**
 * 删除系统变量
 * @param {number} id - 变量ID
 * @returns {Promise}
 */
export function deleteSysVar(id) {
  return request({
    url: '/api/sysvars',
    method: 'delete',
    data: { id },
  })
}
