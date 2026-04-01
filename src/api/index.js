/**
 * API统一导出入口
 */
import * as auth from './auth'
import * as system from './system'
import * as network from './network'
import * as commInterface from './commInterface'
import * as deviceTemplate from './deviceTemplate'
import * as dataCollection from './dataCollection'
import * as log from './log'
import * as ota from './ota'

export default {
  auth,
  system,
  network,
  commInterface,
  deviceTemplate,
  dataCollection,
  log,
  ota,
}
