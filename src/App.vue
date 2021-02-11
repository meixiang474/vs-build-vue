<template>
  <div class="app">
    <h1>这个是页面内容</h1>
    <visual-editor 
      v-model="jsonData" 
      :config="visualConfig" 
      :formData="formData"
      :customProps="customProps"
    >
      <!-- <template #subBtn> 
        <el-button>
          自定义按钮
        </el-button>
      </template> -->
    </visual-editor>
    <div :style="{textAlign: 'center'}">
      {{JSON.stringify(formData)}}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { VisualEditor } from './packages';
import {visualConfig} from './packages/visual.config'
import jsonData from './data.json';

export default defineComponent({
  name: "App",
  components: {
    VisualEditor,
  },
  data() {
    return {
      visualConfig,
      jsonData,
      formData: {
        username: 'admin'
      },
      customProps: {
        subBtn: {
          onClick: () => {
            this.$notify({message: '执行表单数据校验以及调教到服务器的动作'})
          },
         
        },
        myInput: {
          onChange: () => {
            console.log(1)
          }
        }
      }
    }
  },
});
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
}
.app {
  padding-bottom: 300px;
}
</style>
