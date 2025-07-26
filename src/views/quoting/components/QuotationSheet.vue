<template>
  <div class="quotation-sheet">
    <div class="quotation-actions">
      <el-button-group>
        <el-button type="primary" @click="switchToEdit" :disabled="isEditMode">
          <el-icon>
            <EditPen />
          </el-icon>编辑 </el-button>
        <el-button type="info" @click="switchToPreview" :disabled="!isEditMode">
          <el-icon>
            <View />
          </el-icon>预览 </el-button>
        <el-button type="success" @click="handleExportPDF">
          <el-icon>
            <Document />
          </el-icon>导出PDF </el-button>
      </el-button-group>
    </div>

    <!-- 编辑模式 -->
    <div v-if="isEditMode" class="quotation-edit-mode">
      <el-form :model="editableQuotation" label-position="top">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="客户名称">
              <el-input v-model="editableQuotation.customer" placeholder="客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系人">
              <el-input v-model="editableQuotation.contact" placeholder="联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话">
              <el-input v-model="editableQuotation.phone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- <el-form-item label="价格类型">
          <el-select v-model="editableQuotation.priceType" @change="handlePriceTypeChange">
            <el-option label="统一含税" value="统一含税" />
            <el-option label="销售含税" value="销售含税" />
            <el-option label="经理含税" value="经理含税" />
            <el-option label="总经理含税" value="总经理含税" />
          </el-select>
        </el-form-item> -->

        <el-table :data="editableQuotation.items" style="width: 100%" border>
          <el-table-column type="index" width="50" label="#" />
          <el-table-column prop="category" label="类别" width="180">
            <template #default="scope">
              <el-input v-model="scope.row.category" placeholder="请输入类别" />
            </template>
          </el-table-column>
          <el-table-column prop="model" label="型号" min-width="220">
            <template #default="scope">
              <el-input v-model="scope.row.model" placeholder="请输入型号" />
            </template>
          </el-table-column>
          <el-table-column prop="price" label="单价" width="120">
            <template #default="scope">
              <el-input-number v-model="scope.row.price" :min="0" :precision="2" :step="10" />
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120">
            <template #default="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" :precision="0" :step="1"
                @change="updateItemSubtotal(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="scope">
              <span>¥{{ formatPrice(scope.row.price * scope.row.quantity) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="danger" size="small" icon="Delete" @click="removeItem(scope.$index)" circle />
            </template>
          </el-table-column>
        </el-table>

        <!-- 添加行按钮 -->
        <div class="add-row-container">
          <el-button type="primary" @click="addNewRow" icon="Plus" plain>添加行项目</el-button>
        </div>

        <div class="quotation-summary">
          <div class="total-amount">
            总计：¥{{ formatPrice(editableQuotation.totalAmount) }}
          </div>
          <el-button type="primary" @click="saveQuotation">保存</el-button>
        </div>
      </el-form>
    </div>

    <!-- 预览模式 -->
    <div v-else class="quotation-preview-mode" ref="printSection">
      <div class="quotation-header">
        <h2>产品报价单</h2>
        <div class="quotation-info">
          <div>
            <span class="label">报价单号：</span>
            <span>{{ editableQuotation.id }}</span>
          </div>
          <div>
            <span class="label">日期：</span>
            <span>{{ editableQuotation.date }}</span>
          </div>
          <div>
            <span class="label">客户名称：</span>
            <span>{{ editableQuotation.customer }}</span>
          </div>
          <div>
            <span class="label">联系人：</span>
            <span>{{ editableQuotation.contact }}</span>
          </div>
          <div>
            <span class="label">联系电话：</span>
            <span>{{ editableQuotation.phone }}</span>
          </div>
          <!-- <div>
            <span class="label">价格类型：</span>
            <span>{{ editableQuotation.priceType }}</span>
          </div> -->
        </div>
      </div>

      <div class="quotation-content">
        <table class="quotation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>类别</th>
              <th>型号</th>
              <th>单价</th>
              <th>数量</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in editableQuotation.items" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.model }}</td>
              <td>¥{{ formatPrice(item.price) }}</td>
              <td>{{ item.quantity }}</td>
              <td>¥{{ formatPrice(item.price * item.quantity) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-right">总计：</td>
              <td>¥{{ formatPrice(editableQuotation.totalAmount) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="quotation-footer">
        <div>
          <p>备注：</p>
          <p>1. 报价有效期为30天</p>
          <p>2. 本报价单最终解释权归我公司所有</p>
          <p>3. 感谢您的合作！</p>
        </div>
        <div class="company-info">
          <p>公司名称：启阳科技</p>
          <p>联系电话：13800138000</p>
          <p>地址：北京市海淀区</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import html2pdf from 'html2pdf.js'
import { ElMessage } from 'element-plus'

export default {
  name: 'QuotationSheet',
  props: {
    quotationData: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    // 编辑模式状态
    const isEditMode = ref(true)
    // 可编辑的报价单数据（深拷贝）
    const editableQuotation = reactive(JSON.parse(JSON.stringify(props.quotationData)))
    // 打印区域的引用
    const printSection = ref(null)

    // 监听外部传入的数据变化
    watch(() => props.quotationData, (newVal) => {
      Object.assign(editableQuotation, JSON.parse(JSON.stringify(newVal)))
    }, { deep: true })

    // 价格格式化
    const formatPrice = (value) => {
      if (!value) return '0.00'
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    // 计算总价
    const calculateTotal = () => {
      editableQuotation.totalAmount = editableQuotation.items.reduce((sum, item) => {
        return sum + item.price * item.quantity
      }, 0)
    }

    // 更新单项小计
    const updateItemSubtotal = (item) => {
      item.subtotal = item.price * item.quantity
      calculateTotal()
    }

    // 移除项目
    const removeItem = (index) => {
      editableQuotation.items.splice(index, 1)
      calculateTotal()
    }

    // 添加新行
    const addNewRow = () => {
      const newItem = {
        id: `new-${Date.now()}`, // 生成临时ID
        category: '',
        model: '',
        price: 0,
        quantity: 1,
        subtotal: 0
      }
      editableQuotation.items.push(newItem)
    }

    // 切换到编辑模式
    const switchToEdit = () => {
      isEditMode.value = true
    }

    // 切换到预览模式
    const switchToPreview = () => {
      isEditMode.value = false
    }

    // 更改价格类型时重新计算价格
    const handlePriceTypeChange = () => {
      // 这里简单实现，实际可能需要从原始数据中获取新价格类型的价格
      calculateTotal()
    }

    // 保存报价单
    const saveQuotation = () => {
      calculateTotal() // 确保总价更新
      emit('update:quotation', JSON.parse(JSON.stringify(editableQuotation)))
      ElMessage.success('报价单已保存')
    }

    // 导出PDF
    const handleExportPDF = () => {
      if (isEditMode.value) {
        isEditMode.value = false
        // 使用nextTick等待DOM更新后导出
        setTimeout(() => {
          exportPDF()
          isEditMode.value = true
        }, 100)
      } else {
        exportPDF()
      }
    }

    // 导出PDF的实现
    const exportPDF = () => {
      if (!printSection.value) return

      const element = printSection.value
      const opt = {
        margin: 10,
        filename: `报价单-${editableQuotation.customer || '客户'}-${new Date().toLocaleDateString('zh-CN')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      // 将HTML导出为PDF
      html2pdf().set(opt).from(element).save().then(() => {
        ElMessage.success('PDF导出成功')
        emit('export-pdf')
      }).catch(err => {
        console.error('PDF导出失败', err)
        ElMessage.error('PDF导出失败')
      })
    }

    return {
      isEditMode,
      editableQuotation,
      printSection,
      formatPrice,
      calculateTotal,
      updateItemSubtotal,
      removeItem,
      addNewRow,
      switchToEdit,
      switchToPreview,
      handlePriceTypeChange,
      saveQuotation,
      handleExportPDF
    }
  }
}
</script>

<style scoped>
.quotation-sheet {
  padding: 20px;
}

.quotation-actions {
  margin-bottom: 20px;
}

.add-row-container {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.quotation-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.total-amount {
  font-size: 18px;
  font-weight: bold;
}

/* 预览模式样式 */
.quotation-preview-mode {
  padding: 20px;
  background-color: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.quotation-header {
  text-align: center;
  margin-bottom: 30px;
}

.quotation-header h2 {
  margin-bottom: 20px;
}

.quotation-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  text-align: left;
}

.label {
  font-weight: bold;
}

.quotation-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.quotation-table th,
.quotation-table td {
  border: 1px solid #dcdfe6;
  padding: 10px;
  text-align: center;
}

.quotation-table th {
  background-color: #f5f7fa;
}

.text-right {
  text-align: right;
}

.quotation-footer {
  margin-top: 50px;
  display: flex;
  justify-content: space-between;
}

.company-info {
  text-align: right;
}
</style>