<template>
  <div class="product-quotation">
    <el-form :model="queryParams" ref="queryFormRef" :inline="true">
      <el-form-item label="类别:" prop="category">
        <el-input v-model="queryParams.category" placeholder="请输入类别" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="CPU:" prop="cpu">
        <el-input v-model="queryParams.cpu" placeholder="请输入CPU" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="尺寸:" prop="size">
        <el-input v-model="queryParams.size" placeholder="请输入尺寸" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="型号:" prop="model">
        <el-input v-model="queryParams.model" placeholder="请输入型号" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery" type="primary" icon="Search"> 搜索 </el-button>
        <el-button @click="resetQuery" type="warning" icon="Refresh"> 重置 </el-button>
      </el-form-item>
    </el-form>
    <div class="search-container">
      <el-table :data="paginatedData" stripe border style="width: 100%; margin-top: 20px"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="category" label="类别" width="180" />
        <el-table-column prop="cpu" label="CPU" width="120" />
        <el-table-column prop="size" label="尺寸" width="120" />
        <el-table-column prop="model" label="型号" width="240" />
        <el-table-column prop="memory" label="内存" width="100" />
        <el-table-column prop="disk1" label="硬盘类型" width="100" />
        <el-table-column prop="wifi" label="WiFi" width="100" />
        <el-table-column label="选配" width="200">
          <template #default="{ row }">
            <el-tag v-for="option in row.options" :key="option" size="small" style="margin: 2px">
              {{ option }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bz" label="备注">
          <template #default="{ row }">
            <el-tooltip :content="row.bz" raw-content v-if="row.bz" placement="top">
              <el-icon color="#409eff">
                <Tickets />
              </el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="300">
          <template #default="{ row }">
            <div class="price-tags">
              <el-tag v-for="(price, type) in row.price" :key="type" :type="getPriceTagType(type)" size="small"
                style="margin: 2px">
                {{ type }}: ¥{{ price }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-link underline="never" icon="Plus" @click="addToQuotation(row)">添加到报价</el-link>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredProducts.length"
        @current-change="handleCurrentChange" @size-change="handleSizeChange" :page-sizes="[10, 20, 50, 100]" background
        style="margin-top: 20px; justify-content: flex-end" />
    </div>



    <!-- 报价单抽屉 -->
    <el-drawer v-model="drawerVisible" title="当前报价单" size="60%" direction="rtl">
      <quotation-sheet v-if="drawerVisible" :quotation-data="quotationData" @update:quotation="updateQuotation"
        @export-pdf="exportPDF" />
    </el-drawer>

    <!-- 报价单创建对话框 -->
    <el-dialog v-model="dialogVisible" title="创建报价单" width="50%">
      <el-form :model="quotationForm" label-width="120px">
        <el-form-item label="客户名称">
          <el-input v-model="quotationForm.customer" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="quotationForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="quotationForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="报价价格类型">
          <el-select v-model="quotationForm.priceType" placeholder="请选择价格类型">
            <el-option label="统一含税" value="统一含税" />
            <el-option label="销售含税" value="销售含税" />
            <el-option label="经理含税" value="经理含税" />
            <el-option label="总经理含税" value="总经理含税" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createQuotation">创建</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import productData from './mock.json'
import QuotationSheet from './components/QuotationSheet.vue'

onMounted(() => {
  handleQuery()
  console.log(getCPU(), getSize())
})
// 定义名称
defineOptions({ name: 'ProductQuotation' })
// 获取CPU种类
const getCPU = () => {
  const cpu = productData.map(item => item.cpu)
  return [...new Set(cpu)]
}
const getSize = () => {
  const size = productData.map(item => item.size)
  return [...new Set(size)]
}

// 搜索关键词
const queryParams = ref({ category: '', cpu: '', size: '', model: '' })
// 查询表单引用
const queryFormRef = ref(null)
const resetQuery = () => {
  queryParams.value = { category: '', cpu: '', size: '', model: '' }
  if (queryFormRef.value) {
    queryFormRef.value.resetFields()
  }
}

const filteredProducts = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 分页后的数据
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredProducts.value.slice(startIndex, endIndex)
})
// 过滤后的产品数据
const handleQuery = (() => {
  console.log('查询参数:', queryParams.value)
  filteredProducts.value = productData.filter((product) => {
    return Object.keys(queryParams.value).every((key) => {
      const queryValue = queryParams.value[key].toLowerCase()
      if (!queryValue) return true // 如果查询值为空，则不过滤
      return product[key].toLowerCase().includes(queryValue)
    })
  })
})

// 根据价格类型返回不同的tag样式
const getPriceTagType = (type) => {
  switch (type) {
    case '统一含税':
      return 'primary'
    case '销售含税':
      return 'success'
    case '经理含税':
      return 'warning'
    case '总经理含税':
      return 'danger'
    default:
      return ''
  }
}

// 页码改变处理
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 每页条数改变处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

// 报价单相关
const selectedProducts = ref([])
const quotationData = ref({
  id: Date.now().toString(),
  date: new Date().toLocaleDateString('zh-CN'),
  customer: '',
  contact: '',
  phone: '',
  priceType: '统一含税',
  items: [],
  totalAmount: 0
})

// 选择产品变更
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

// 将产品添加到报价单
const addToQuotation = (product) => {
  // 检查是否已经存在相同产品
  const existingIndex = quotationData.value.items.findIndex(item => item.id === product.id)

  if (existingIndex > -1) {
    // 如果已存在，增加数量
    quotationData.value.items[existingIndex].quantity += 1
  } else {
    // 不存在则添加新项
    quotationData.value.items.push({
      id: product.id,
      category: product.category,
      model: product.model,
      price: product.price[quotationData.value.priceType] || 0,
      quantity: 1,
      subtotal: product.price[quotationData.value.priceType] || 0
    })
  }

  // 重新计算总价
  calculateTotal()

  // 提示用户
  ElMessage.success(`已添加 ${product.model} 到报价单`)
}

// 计算总价
const calculateTotal = () => {
  quotationData.value.totalAmount = quotationData.value.items.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
}

// 更新报价单数据
const updateQuotation = (newQuotation) => {
  quotationData.value = newQuotation
  calculateTotal()
}

// 报价单对话框控制
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const quotationForm = ref({
  customer: '',
  contact: '',
  phone: '',
  priceType: '统一含税'
})

// 显示报价单创建对话框
const showQuotationDialog = () => {
  dialogVisible.value = true
}

// 显示报价单抽屉
const showQuotationDrawer = () => {
  drawerVisible.value = true
}

// 创建报价单
const createQuotation = () => {
  // 更新报价单信息
  quotationData.value.customer = quotationForm.value.customer
  quotationData.value.contact = quotationForm.value.contact
  quotationData.value.phone = quotationForm.value.phone
  quotationData.value.priceType = quotationForm.value.priceType

  // 清空现有报价单项
  quotationData.value.items = []

  // 添加所选产品到报价单
  selectedProducts.value.forEach(product => {
    quotationData.value.items.push({
      id: product.id,
      category: product.category,
      model: product.model,
      price: product.price[quotationForm.value.priceType] || 0,
      quantity: 1,
      subtotal: product.price[quotationForm.value.priceType] || 0
    })
  })

  // 计算总价
  calculateTotal()

  // 关闭对话框，打开抽屉
  dialogVisible.value = false
  drawerVisible.value = true
}



// 导出PDF
const exportPDF = () => {
  // 在QuotationSheet组件中实现
}
</script>
