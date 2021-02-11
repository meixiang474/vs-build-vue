<template>
  <div class="app">
    <h1>这个是页面内容</h1>
    <visual-editor v-model="jsonData" :config="visualConfig" :formData="formData">
      <template #subBtn> 
        <el-button>
          自定义按钮
        </el-button>
      </template>
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
