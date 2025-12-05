/**
 * 公共工具函数
 */

// 格式化时间
export function formatTime(date) {
  return new Date(date).toLocaleString()
}

// 深拷贝
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// 防抖函数
export function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
export function throttle(fn, delay) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}
