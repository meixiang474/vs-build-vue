import { VisualEditorProps } from '@/packages/utils/visual-editor-props';
import { defineComponent, PropType, reactive, onMounted, getCurrentInstance, createApp } from 'vue';
import { defer } from '@/packages/utils/defer'
import { ElButton, ElDialog, ElTable, ElTableColumn, ElInput } from 'element-plus';
import deepcopy from 'deepcopy';

export interface TablePropEditorServiceOption {
  data: any[];
  config: VisualEditorProps;
  onConfirm: (val: any[]) => void;
}

const ServiceComponent = defineComponent({
  props: {
    option: {
      type: Object as PropType<TablePropEditorServiceOption>,
      required: true
    },
  },
  setup(props) {
    const ctx = getCurrentInstance()!
    const state = reactive({
      option: props.option,
      showFlag: false,
      mounted: (() => {
        const dfd = defer()
        onMounted(() => {
          setTimeout(dfd.resolve, 0)
        })
        return dfd.promise
      })(),
      editData: [] as any[]
    })

    const methods = {
      service: (option: TablePropEditorServiceOption) => {
        state.option = option
        state.editData = deepcopy(option.data || [])
        methods.show()
      },
      show: async () => {
        await state.mounted
        state.showFlag = true
      },
      hide: () => {
        state.showFlag = false
      },
      add: () => {
        state.editData.push({})
      },
      reset: () => {
        state.editData = deepcopy(state.option.data)
      },
    }

    const handler = {
      onConfirm: () => {
        state.option.onConfirm(state.editData)
        methods.hide()
      },
      onCancel: () => {
        methods.hide()
      }
    }

    Object.assign(ctx.proxy, methods)
    return () => (
      <ElDialog modelValue={state.showFlag}>
        {{
          default: () => (
            <div>
              <div>
                <ElButton {...{ onClick: methods.add } as any}>添加</ElButton>
                <ElButton {...{ onClick: methods.reset } as any}>重置</ElButton>
              </div>
              <ElTable data={state.editData}>
                <ElTableColumn {...{ type: 'index' } as any}></ElTableColumn>
                {state.option.config.table!.options.map((item, index) => (
                  <ElTableColumn {...{ label: item.label } as any} key={index}>
                    {{ default: ({ row }: { row: any }) => <ElInput v-model={row[item.field]} /> }}
                  </ElTableColumn>
                ))}
                <ElTableColumn {...{ label: '操作' } as any}>
                  <ElButton type="danger">
                    删除
                </ElButton>
                </ElTableColumn>
              </ElTable>
            </div>
          ),
          footer: () => (
            <>
              <ElButton {...{ onClick: handler.onCancel } as any}>取消</ElButton>
              <ElButton type="primary" {...{ onClick: handler.onConfirm } as any}>确定</ElButton>
            </>
          )
        }}
      </ElDialog>
    )
  }
})

export const $$tablePropEditor = (() => {
  let ins: any
  return (option: Omit<TablePropEditorServiceOption, 'onConfirm'>) => {
    if (!ins) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const app = createApp(ServiceComponent, { option })
      ins = app.mount(el)
    }
    const dfd = defer<any[]>()
    ins.service({
      ...option,
      onConfirm: dfd.resolve
    })
    return dfd.promise
  }
})()