import { defineComponent, PropType, reactive, createApp, getCurrentInstance } from 'vue'
import { ElInput, ElButton, ElDialog } from 'element-plus'
import { defer } from './defer'
enum DialogServiceEditType {
  textarea = 'textarea',
  input = 'input'
}
interface DialogServiceOption {
  title?: string;
  editType: DialogServiceEditType;
  editReadonly?: boolean;
  editValue?: string | null;
  onConfirm: (val?: string | null) => void;
}

const KeyGenerator = (() => {
  let count = 0
  return () => {
    return `auto_key_${count++}`
  }
})()

const ServiceComponent = defineComponent({
  props: {
    option: {
      type: Object as PropType<DialogServiceOption>,
      required: true
    }
  },
  setup(props) {
    const ctx = getCurrentInstance()!
    const state = reactive({
      option: props.option,
      editValue: undefined as string | null | undefined,
      showFlag: false,
      key: KeyGenerator()
    })

    const methods = {
      service: (option: DialogServiceOption) => {
        state.option = option
        state.editValue = option.editValue
        state.key = KeyGenerator()
        methods.show()
      },
      show: () => {
        state.showFlag = true
      },
      hide: () => {
        state.showFlag = false
      }
    }

    const handler = {
      onConfirm: () => {
        state.option.onConfirm(state.editValue)
        methods.hide()
      },
      onCancel: () => {
        methods.hide()
      }
    }

    Object.assign(ctx.proxy, methods)

    return () => (
      <ElDialog modelValue={state.showFlag} title={state.option.title} key={state.key}>
        {{
          default: () => (
            <div>
              {state.option.editType === DialogServiceEditType.textarea ? (
                <ElInput type="textarea" {...{ rows: 10 }} v-model={state.editValue} readonly={state.option.editReadonly} />
              ) : (
                  <ElInput v-model={state.editValue} readonly={state.option.editReadonly} />
                )}
            </div>
          ),
          footer: () => (
            <div>
              <ElButton {...{ onClick: handler.onCancel } as any} >取消</ElButton>
              <ElButton {...{ onClick: handler.onConfirm } as any} >确定</ElButton>
            </div>
          )
        }}
      </ElDialog>
    )
  }
})

const DialogService = (() => {
  let ins: any
  return (option: DialogServiceOption) => {
    if (!ins) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const app = createApp(ServiceComponent, { option })
      ins = app.mount(el)
    }
    ins.service(option)
  }
})()

export const $$dialog = Object.assign(DialogService, {
  input: (initValue?: string, title?: string, option?: DialogServiceOption) => {
    const dfd = defer<string | undefined | null>()
    const opt = (option || { editType: DialogServiceEditType.input, onConfirm: dfd.resolve, title }) as DialogServiceOption
    DialogService(opt)
    return dfd.promise
  },
  textarea: (initValue?: string, title?: string, option?: Omit<DialogServiceOption, 'editType' | 'onConfirm'>) => {
    const dfd = defer<string | undefined | null>()
    const opt: DialogServiceOption = {
      ...option,
      editType: DialogServiceEditType.textarea, onConfirm: dfd.resolve,
      title,
      editValue: initValue
    }
    DialogService(opt)
    return dfd.promise
  }
})