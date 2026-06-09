import request from '@/utils/request'

/**
 * 点位别名管理 API
 */

// 获取点位别名列表
export function getPointAliasList(params) {
  return request({
    url: '/api/point_alias/all',
    method: 'get',
    params,
  })
}

// 批量生成别名
export function batchGenerateAlias(data) {
  return request({
    url: '/api/point_alias/batch_generate',
    method: 'post',
    data,
  })
}

// 更新别名
export function updateAlias(data) {
  return request({
    url: '/api/point_alias/update',
    method: 'put',
    data,
  })
}

// 切换启用/禁用状态
export function toggleAliasActive(data) {
  return request({
    url: '/api/point_alias/toggle_active',
    method: 'put',
    data,
  })
}

// 删除别名
export function deleteAlias(data) {
  return request({
    url: '/api/point_alias/delete',
    method: 'delete',
    data,
  })
}

// 全量重建别名表
export function rebuildAliasTable() {
  return request({
    url: '/api/point_alias/rebuild',
    method: 'post',
  })
}

// 增量同步别名表
export function syncAliasTable() {
  return request({
    url: '/api/point_alias/sync',
    method: 'post',
  })
}

// 检查别名表状态
export function checkAliasStatus() {
  return request({
    url: '/api/point_alias/status',
    method: 'get',
  })
}
