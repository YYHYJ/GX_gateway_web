/**
 * 认证相关API
 * 原理：封装所有与用户认证相关的接口调用
 */

import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data 登录数据
 * @param {string} data.username 用户名
 * @param {string} data.password 密码
 * @returns {Promise} 返回Promise对象
 */
export function login(data) {
  return request({
    url: '/api/login',
    method: 'post',
    data,
  })
}

// 导出所有API函数
export default {
  login,
}
