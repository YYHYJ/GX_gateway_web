import request from '@/utils/request'

// 获取所有设备模板
export function getDeviceTemplates() {
  return request({
    url: '/api/device/modelConfig',
    method: 'get',
  })
}

//根据ID获取单个模板
export function getDeviceTemplate(id) {
  return request({
    url: `/api/device/modelConfig/${id}`,
    method: 'get',
  })
}

// 创建模板
export function createDeviceTemplate(data) {
  return request({
    url: '/api/device/modelConfig',
    method: 'post',
    data,
  })
}

// 更新模板
export function updateDeviceTemplate(id, data) {
  return request({
    url: `/api/device/modelConfig/${id}`,
    method: 'put',
    data,
  })
}

// 删除模板
export function deleteDeviceTemplate(id) {
  return request({
    url: `/api/device/modelConfig/${id}`,
    method: 'delete',
  })
}
