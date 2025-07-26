<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="layout-aside" :collapse="collapsed" collapsible>
      <div class="logo p-4 text-center">
        <h1 class="text-white text-xl">报价单</h1>
      </div>
      <el-menu :default-active="selectedKey" class="el-menu-vertical-demo" background-color="#001529" text-color="#fff"
        active-text-color="#ffd04b" @select="selectChange" router>
        <el-menu-item index="product-quote">
          <el-icon>
            <Memo />
          </el-icon>
          产品报价
        </el-menu-item>
        <el-menu-item index="accessory-quote">
          <el-icon>
            <Memo />
          </el-icon>
          配件信息
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="bg-white p-2 flex justify-between items-center">
        <el-button text @click="toggleCollapsed">
          <el-icon>
            <component :is="collapsed ? 'i-ep-expand' : 'i-ep-fold'" />
          </el-icon>
        </el-button>
      </el-header>

      <el-main class="site-layout-content">
        <div class="content-container">
          <router-view v-if="loaded" />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const loaded = ref(true)
const selectedKey = ref('product-quote')
const selectChange = (key: string) => {
  console.log('Selected key:', key)
  selectedKey.value = key
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
.layout-container {
  height: 100vh;

  .layout-aside {
    background-color: #001529;
    color: #fff;
  }
}

.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.site-layout-content {
  background: #f0f2f5;
  padding: 16px;
  height: 100%;
}

.content-container {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
  height: 100%;
  overflow: auto;
}
</style>
