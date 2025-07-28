<template>
  <div class="create-quotation">


    <!-- 基本信息表单 -->
    <el-form :model="quotationForm" :rules="rules" ref="quotationFormRef" label-width="120px">
      <el-form-item label="客户名称" prop="customer">
        <el-input v-model="quotationForm.customer" placeholder="请输入客户名称" />
      </el-form-item>
    </el-form>


    <!-- 产品选择 -->
    <div class="card-header">
      <span>添加产品</span>
      <el-button type="primary" @click="showProductSelector">选择产品</el-button>
    </div>

    <!-- 已选产品列表 -->
    <el-table :data="quotationItems" stripe border>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="category" label="类别" />
      <el-table-column prop="model" label="型号" />
      <el-table-column prop="price" label="单价">
        <template #default="{ row }">
          ¥{{ row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.quantity" :min="1" @change="updateSubtotal(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="subtotal" label="小计" width="120">
        <template #default="{ row }">
          ¥{{ row.subtotal }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ $index }">
          <el-button type="danger" icon="Delete" circle @click="removeItem($index)" />
        </template>
      </el-table-column>
    </el-table>

    <div class="total-amount" style="margin-top: 20px; text-align: right">
      <span style="font-size: 16px; margin-right: 10px">总计金额:</span>
      <span style="font-size: 20px; color: #f56c6c; font-weight: bold">¥{{ totalAmount }}</span>
    </div>

    <!-- 备注信息 -->
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>备注信息</span>
        </div>
      </template>
      <el-form :model="quotationForm">
        <el-form-item>
          <el-input v-model="quotationForm.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons" style="margin-top: 20px; text-align: center">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" @click="saveQuotation">保存报价单</el-button>
      <el-button type="success" @click="previewQuotation">预览</el-button>
    </div>

    <!-- 产品选择对话框 -->
    <el-dialog v-model="productDialogVisible" title="选择产品" width="80%">
      <div class="product-search" style="margin-bottom: 20px">
        <el-form :model="queryParams" :inline="true">
          <el-form-item label="类别">
            <el-input v-model="queryParams.category" placeholder="请输入类别" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="CPU">
            <el-input v-model="queryParams.cpu" placeholder="请输入CPU" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="型号">
            <el-input v-model="queryParams.model" placeholder="请输入型号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery" type="primary" icon="Search">搜索</el-button>
            <el-button @click="resetQuery" icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="filteredProducts" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="cpu" label="CPU" />
        <el-table-column prop="model" label="型号" />
        <el-table-column prop="memory" label="内存" />
        <el-table-column label="价格" width="180">
          <template #default="{ row }">
            <el-tag type="success">
              {{ quotationForm.priceType }}: ¥{{ row.price[quotationForm.priceType] || 0 }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredProducts.length"
        @current-change="handleCurrentChange" @size-change="handleSizeChange" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" style="margin-top: 20px; justify-content: flex-end" />

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="productDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmProductSelection">确认选择</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预览报价单抽屉 -->
    <el-drawer v-model="previewDrawerVisible" title="报价单预览" size="60%" direction="rtl">
      <quotation-sheet v-if="previewDrawerVisible" :quotation-data="quotationData" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import productData from './mock.json'
import QuotationSheet from './components/QuotationSheet.vue'

// 定义组件名称
defineOptions({ name: 'CreateQuotation' })

// 报价单表单
const quotationFormRef = ref(null)
const quotationForm = reactive({
  customerId: '',
  customer: '',
  customerCode: '',
  quoteDate: new Date(),
  customerType: '',
  priceLevel: '',
  contact: '',
  phone: '',
  quoteNumber: '自动生成并锁定',
  salesPerson: '',
  salesDept: '',
  priceType: '统一含税',
  remarks: ''
})

// 表单验证规则
const rules = {
  customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
  quoteDate: [{ required: true, message: '请选择报价日期', trigger: 'change' }]
}

// 报价单项目
const quotationItems = ref([])

// 价格汇总计算
const originalTotal = ref('0.00')
const discountAmount = ref('0.00')
const discountRate = ref('')
const finalTotal = ref('0.00')
const amountInWords = ref('零')
const profitRate = ref('')

// 第二组价格（根据截图有两组相同的价格信息）
const originalTotal2 = ref('0.00')
const discountAmount2 = ref('0.00')
const discountRate2 = ref('')
const finalTotal2 = ref('0.00')
const amountInWords2 = ref('零')
const profitRate2 = ref('')

// 计算总金额
const totalAmount = computed(() => {
  const total = quotationItems.value.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  originalTotal.value = total.toFixed(2)
  originalTotal2.value = total.toFixed(2)
  calculateFinalTotal()
  return total
})

// 计算最终金额
const calculateFinalTotal = () => {
  const discount = parseFloat(discountAmount.value) || 0
  const total = parseFloat(originalTotal.value) || 0
  const final = Math.max(total - discount, 0)
  finalTotal.value = final.toFixed(2)

  // 计算折扣率
  if (total > 0) {
    discountRate.value = ((discount / total) * 100).toFixed(2)
  } else {
    discountRate.value = '0.00'
  }

  // 同步到第二组数据
  discountAmount2.value = discountAmount.value
  discountRate2.value = discountRate.value
  finalTotal2.value = finalTotal.value

  // 更新金额大写
  amountInWords.value = convertToChineseAmount(final)
  amountInWords2.value = amountInWords.value
}

// 金额转中文大写
const convertToChineseAmount = (amount) => {
  if (amount === 0) return '零'
  // 简单实现，实际项目中可能需要更复杂的转换
  return '人民币' + amount.toFixed(2) + '元'
}

// 更新小计
const updateSubtotal = (row) => {
  row.subtotal = (row.price || 0) * (row.quantity || 0)
}

// 添加行
const addRow = () => {
  quotationItems.value.push({
    id: Date.now(),
    model: '',
    productCode: '',
    manufacturer: '',
    spec: '',
    unit: '',
    price: '',
    quantity: 1,
    subtotal: 0,
    remark: ''
  })
}

// 添加配置行
const addConfigRow = () => {
  quotationItems.value.push({
    id: Date.now(),
    model: '型号1',
    productCode: '2',
    manufacturer: '配置项',
    spec: '规格参数1',
    unit: '单位',
    price: '价格',
    quantity: 1,
    subtotal: 0,
    remark: '6',
    isConfig: true // 标记为配置行
  })
}

// 删除行
const removeRow = (index) => {
  quotationItems.value.splice(index, 1)
}

// 单元格合并方法
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 列索引 2, 3, 4 对应类别、型号、规格参数列
  if (row.isConfig) {
    if (columnIndex == 1) {
      return {
        rowspan: 1,
        colspan: 4
      }
    } else if (columnIndex == 2 || columnIndex == 3 || columnIndex == 4) {
      return {
        rowspan: 1,
        colspan: 0
      }
    }


  }
  // if (columnIndex == 2) {
  //   if (row.isConfig) {
  //     return {
  //       rowspan: 1,
  //       colspan: 3 // 合并这三列
  //     }
  //   } else if (columnIndex > 2 && columnIndex <= 4) {
  //     // 对于非配置行的型号和规格参数列，不显示
  //     return {
  //       rowspan: 1,
  //       colspan: 1
  //     }
  //   }
  // }
}

// 快速填报
const quickFill = () => {
  productDialogVisible.value = true
}

// 选择客户
const selectCustomer = () => {
  ElMessage.info('选择客户功能待实现')
  // 这里可以打开选择客户的对话框
}

// 选择销售人员
const selectSalesPerson = () => {
  ElMessage.info('选择销售人员功能待实现')
  // 这里可以打开选择销售人员的对话框
}

// 选择销售部门
const selectSalesDept = () => {
  ElMessage.info('选择销售部门功能待实现')
  // 这里可以打开选择销售部门的对话框
}

// 移除产品项
const removeItem = (index) => {
  quotationItems.value.splice(index, 1)
}

// 重置表单
const resetForm = () => {
  if (quotationFormRef.value) {
    quotationFormRef.value.resetFields()
  }
  quotationForm.remarks = ''
  quotationItems.value = []
  discountAmount.value = '0.00'
  discountAmount2.value = '0.00'
  calculateFinalTotal()
}

// 产品选择相关
const productDialogVisible = ref(false)
const selectedProducts = ref([])
const queryParams = ref({ category: '', cpu: '', model: '' })
const currentPage = ref(1)
const pageSize = ref(10)

// 显示产品选择对话框
const showProductSelector = () => {
  productDialogVisible.value = true
  selectedProducts.value = []
}

// 过滤产品列表
const filteredProducts = computed(() => {
  return productData.filter((product) => {
    return Object.keys(queryParams.value).every((key) => {
      const queryValue = queryParams.value[key].toLowerCase()
      if (!queryValue) return true // 如果查询值为空，则不过滤
      return product[key].toLowerCase().includes(queryValue)
    })
  }).slice(0, 10)
})

// 搜索和重置
const handleQuery = () => {
  currentPage.value = 1
}

const resetQuery = () => {
  queryParams.value = { category: '', cpu: '', model: '' }
  currentPage.value = 1
}

// 分页处理
const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 选择产品变更
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

// 确认选择产品
const confirmProductSelection = () => {
  selectedProducts.value.forEach(product => {
    // 检查是否已存在
    const existingIndex = quotationItems.value.findIndex(item => item.id === product.id)

    if (existingIndex === -1) {
      // 不存在则添加
      const price = product.price[quotationForm.priceType] || 0
      quotationItems.value.push({
        id: product.id,
        model: product.model,
        productCode: product.id,
        manufacturer: product.category,
        spec: product.cpu,
        unit: '台',
        price: price,
        quantity: 1,
        subtotal: price,
        remark: ''
      })
    }
  })

  productDialogVisible.value = false
  ElMessage.success(`已添加 ${selectedProducts.value.length} 个产品到报价单`)
}

// 报价单预览相关
const previewDrawerVisible = ref(false)
const quotationData = computed(() => {
  return {
    id: quotationForm.quoteNumber || Date.now().toString(),
    date: new Date().toLocaleDateString('zh-CN'),
    customer: quotationForm.customer,
    contact: quotationForm.contact,
    phone: quotationForm.phone,
    priceType: quotationForm.priceType,
    remarks: quotationForm.remarks,
    items: quotationItems.value,
    totalAmount: parseFloat(finalTotal.value) || 0
  }
})

// 预览报价单
const previewQuotation = () => {
  if (!quotationItems.value.length) {
    ElMessage.warning('请先添加产品到报价单')
    return
  }

  previewDrawerVisible.value = true
}

// 保存报价单
const saveQuotation = () => {
  if (!quotationItems.value.length) {
    ElMessage.warning('请先添加产品到报价单')
    return
  }

  quotationFormRef.value.validate((valid) => {
    if (valid) {
      // 这里可以添加保存报价单的逻辑
      ElMessage.success('报价单保存成功')
      // TODO: 保存到数据库或其他存储
    }
  })
}

// 表格引用
const quotationTableRef = ref(null)

// 处理行拖拽
const handleRowDrop = (params) => {
  const { newIndex, oldIndex } = params;
  const currRow = quotationItems.value.splice(oldIndex, 1)[0];
  quotationItems.value.splice(newIndex, 0, currRow);
  ElMessage.success(`移动行从 ${oldIndex + 1} 到 ${newIndex + 1}`);
}

</script>

<style scoped>
.create-quotation {
  /* padding: 20px; */
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

.section-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.basic-info-form :deep(.el-form-item) {
  margin-bottom: 10px;
  flex: 1;
  min-width: 280px;
}

.basic-info-form :deep(.el-input),
.basic-info-form :deep(.el-select),
.basic-info-form :deep(.el-date-editor) {
  width: 100%;
}

.select-button {
  width: 100%;
}

.price-summary {
  margin-top: 30px;
}

.summary-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 14px;
  color: #606266;
}

.bottom-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 添加拖拽样式 */
.create-quotation :deep(.el-table .el-table__row.row-dragging) {
  opacity: 0.7;
  cursor: move;
  background-color: #f0f9eb;
}
</style>
