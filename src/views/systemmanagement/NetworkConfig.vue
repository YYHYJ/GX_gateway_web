<template>
  <MainLayout
    active-nav="system-management"
    active-sub-item="network-config"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="网络配置" :breadcrumbs="breadcrumbs" />

      <div class="network-config-content">
        <!-- 1. 网口概览 -->
        <InterfaceOverview
          :interfaces="interfaces"
          :active-name="activeIfaceName"
          @select="selectInterface"
        />

        <!-- 2. 加载/空状态 -->
        <div v-if="loading" class="card">
          <div class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
        </div>
        <div v-else-if="interfaces.length === 0" class="card">
          <div class="empty-state">
            <i class="fas fa-ethernet"></i>
            <h3>未检测到网络接口</h3>
            <p>请检查网关硬件连接</p>
          </div>
        </div>

        <!-- 3. 选中网口详细配置 -->
        <InterfaceDetail
          v-if="!loading && activeIfaceName"
          :iface="activeIface"
          :saving="saving"
          @save="saveConfig"
          @refresh="refreshInterface"
        />

        <!-- 4. 静态路由表 -->
        <RouteTable
          v-if="!loading && interfaces.length > 0"
          :routes="routes"
          :default-route="defaultRoute"
          :interfaces="interfaces"
          @add="openRouteModal(null)"
          @edit="openRouteModal"
          @edit-default="openRouteModal(defaultRoute)"
          @delete="deleteRoute"
        />

        <!-- 5. VPN 配置 -->
        <VpnConfig v-if="!loading && interfaces.length > 0" />
      </div>

      <!-- 路由编辑弹窗 -->
      <RouteModal
        :visible="routeModalVisible"
        :route="routeModalData"
        :interfaces="interfaces"
        :default-iface-name="interfaces[0]?.name || 'eth0'"
        @close="routeModalVisible = false"
        @save="saveRoute"
      />
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import InterfaceOverview from './components/InterfaceOverview.vue'
import InterfaceDetail from './components/InterfaceDetail.vue'
import RouteTable from './components/RouteTable.vue'
import RouteModal from './components/RouteModal.vue'
import VpnConfig from './components/VpnConfig.vue'
import { getInterfaces, updateInterface } from '@/api/network'
import { getRoutes, addRoute, updateRoute, updateDefaultRoute, deleteRoute as deleteRouteApi } from '@/api/network'

export default {
  name: 'NetworkConfig',
  components: { MainLayout, PageHeader, InterfaceOverview, InterfaceDetail, RouteTable, RouteModal, VpnConfig },
  data() {
    return {
      breadcrumbs: [{ title: '系统管理' }, { title: '网络配置' }],
      loading: false,
      saving: false,
      interfaces: [],
      activeIfaceName: null,
      // 路由
      routes: [],
      defaultRoute: {
        isDefault: true,
        destination: '0.0.0.0',
        netmask: '0.0.0.0',
        gateway: '',
        iface: 'eth0',
        metric: 0,
        remark: '默认路由',
      },
      routeModalVisible: false,
      routeModalData: null,
    }
  },
  computed: {
    activeIface() {
      return this.interfaces.find((i) => i.name === this.activeIfaceName) || {}
    },
  },
  mounted() {
    this.loadInterfaces()
    this.loadRoutes()
  },
  methods: {
    handleNavigation() {},

    // ===== 网口相关 =====
    async loadInterfaces() {
      this.loading = true
      try {
        const res = await getInterfaces()
        if (res.code === 200) {
          this.interfaces = res.data || []
          if (this.interfaces.length > 0 && !this.activeIfaceName) {
            this.activeIfaceName = this.interfaces[0].name
          }
        }
      } catch (e) {
        console.error('获取网口列表失败:', e)
      } finally {
        this.loading = false
      }
    },

    selectInterface(iface) {
      this.activeIfaceName = iface.name
    },

    refreshInterface() {
      this.loadInterfaces()
    },

    async saveConfig(formData) {
      this.saving = true
      try {
        const payload = {
          name: this.activeIfaceName,
          mode: formData.mode,
          ip_address: formData.mode === 'static' ? formData.ipAddress : '',
          subnet_mask: formData.mode === 'static' ? formData.subnetMask : '',
          gateway: formData.mode === 'static' ? formData.gateway : '',
          dns1: formData.mode === 'static' ? formData.dns1 : '',
          dns2: formData.mode === 'static' ? formData.dns2 : '',
        }
        const res = await updateInterface(payload)
        if (res.code === 200) {
          alert('网络配置保存成功')
          await this.loadInterfaces()
        } else {
          alert('保存失败: ' + (res.message || '未知错误'))
        }
      } catch (e) {
        alert('保存失败: ' + (e.message || '网络错误'))
      } finally {
        this.saving = false
      }
    },

    // ===== 路由相关 =====
    async loadRoutes() {
      try {
        const res = await getRoutes()
        if (res.code === 200) {
          this.routes = res.data.routes || []
          if (res.data.defaultRoute) {
            this.defaultRoute.gateway = res.data.defaultRoute.gateway || ''
            this.defaultRoute.iface = res.data.defaultRoute.iface || 'eth0'
            this.defaultRoute.metric = res.data.defaultRoute.metric || 0
            this.defaultRoute.remark = res.data.defaultRoute.remark || '默认路由'
          }
        }
      } catch (e) {
        console.error('获取路由列表失败:', e)
      }
    },

    openRouteModal(route) {
      this.routeModalData = route || null
      this.routeModalVisible = true
    },

    async saveRoute(formData) {
      try {
        let res
        if (formData.isDefault) {
          res = await updateDefaultRoute({
            gateway: formData.gateway,
            iface: formData.iface,
            metric: formData.metric,
            remark: formData.remark,
          })
        } else if (formData._editKey) {
          res = await updateRoute(formData)
        } else {
          res = await addRoute(formData)
        }
        if (res.code === 200) {
          await this.loadRoutes()
        } else {
          alert('保存失败: ' + (res.message || '未知错误'))
        }
      } catch (e) {
        alert('保存失败: ' + (e.message || '网络错误'))
      }
      this.routeModalVisible = false
    },

    async deleteRoute(route) {
      if (!confirm(`确定删除到 ${route.destination} 的路由吗？`)) return
      try {
        const res = await deleteRouteApi({ destination: route.destination, netmask: route.netmask })
        if (res.code === 200) {
          await this.loadRoutes()
        } else {
          alert('删除失败: ' + (res.message || '未知错误'))
        }
      } catch (e) {
        alert('删除失败: ' + (e.message || '网络错误'))
      }
    },
  },
}
</script>

<style scoped>
.network-config-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
