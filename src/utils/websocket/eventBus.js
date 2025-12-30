/**
 * 事件总线 - 用于WebSocket事件分发
 */

class EventBus {
  constructor() {
    this.events = new Map()
  }

  /**
   * 监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   * @returns {Function} 取消监听函数
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    const callbacks = this.events.get(event)
    callbacks.add(callback)

    // 返回取消监听函数
    return () => {
      this.off(event, callback)
    }
  }

  /**
   * 一次性监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data)
      this.off(event, onceCallback)
    }

    this.on(event, onceCallback)
  }

  /**
   * 取消监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)
      callbacks.delete(callback)

      if (callbacks.size === 0) {
        this.events.delete(event)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {any} data 事件数据
   */
  emit(event, data) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)
      // 使用Array.from创建副本，避免在迭代过程中修改Set
      Array.from(callbacks).forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件 ${event} 的回调执行失败:`, error)
        }
      })
    }
  }

  /**
   * 清除所有事件监听
   */
  clear() {
    this.events.clear()
  }

  /**
   * 获取指定事件的所有监听器
   * @param {string} event 事件名称
   * @returns {Set<Function>} 监听器集合
   */
  getListeners(event) {
    return this.events.get(event) || new Set()
  }

  /**
   * 检查是否有指定事件的监听器
   * @param {string} event 事件名称
   * @returns {boolean}
   */
  hasListeners(event) {
    return this.events.has(event) && this.events.get(event).size > 0
  }
}

// 导出单例实例
export const eventBus = new EventBus()
