import deepcopy from 'deepcopy';
import { ElColorPicker, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect, ElOption, ElButton } from 'element-plus';
import { defineComponent, PropType, reactive, watch } from 'vue';
import { VisualEditorBlockData, VisualEditorConfig, VisualEditorModelValue } from '../visual-editor.util';
import { VisualEditorProps, VisualEditorPropsType } from './visual-editor-props';
import { TablePropEditor } from '../component/table-prop-editor'

export const VisualOperatorEditor = defineComponent({
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData>
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    },
    dataModel: {
      type: Object as PropType<{ value: VisualEditorModelValue }>,
      required: true
    },
    updateBlock: {
      type: Function as PropType<(newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => void>,
      required: true
    },
    updateModelValue: {
      type: Function as PropType<(val: VisualEditorModelValue) => void>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      editData: {} as any
    })
    const methods = {
      apply: () => {
        if (!props.block) {
          // 当前编辑容器属性
          props.updateModelValue({
            ...props.dataModel.value,
            container: state.editData
          })
        } else {
          // 编辑block属性
          props.updateBlock(state.editData, props.block)
        }
      },
      reset: () => {
        if (!props.block) {
          state.editData = deepcopy(props.dataModel.value.container)
        } else {
          state.editData = deepcopy(props.block)
        }
      }
    }
    watch(() => props.block, () => {
      methods.reset()
    }, { immediate: true })
    const renderEditor = (propName: string, propConfig: VisualEditorProps) => {
      return {
        [VisualEditorPropsType.input]: () => (
          < ElInput v-model={state.editData.props[propName]} />
        ),
        [VisualEditorPropsType.color]: () => (
          <ElColorPicker v-model={state.editData.props[propName]} />
        ),
        [VisualEditorPropsType.select]: () => (
          <ElSelect v-model={state.editData.props[propName]}>
            {propConfig.options!.map(opt => (
              <ElOption label={opt.label} value={opt.val} />
            ))}
          </ElSelect>
        ),
        [VisualEditorPropsType.tabel]: () => (
          <TablePropEditor
            v-model={state.editData.props[propName]}
            propConfig={propConfig}
          />
        )
      }
    }

    return () => {
      const content = [] as JSX.Element[]
      if (!props.block) {
        content.push((
          <>
            <ElFormItem label="容器宽度">
              <ElInputNumber {...{ step: 100 }} v-model={state.editData.width} />
            </ElFormItem>
            <ElFormItem label="容器高度">
              <ElInputNumber {...{ step: 100 }} v-model={state.editData.height} />
            </ElFormItem>
          </>
        ))
      } else {
        const { componentKey } = props.block
        const component = props.config.componentMap[componentKey]
        if (component) {
          if (component.props) {
            content.push((
              <>
                {
                  Object.entries(component.props).map(([propName, propConfig]) => {
                    return (
                      <ElFormItem label={propConfig.label} key={propName}>
                        {renderEditor(propName, propConfig)[propConfig.type]()}
                      </ElFormItem>
                    )
                  })
                }
              </>
            ))
          }
          if (component.model) {
            content.push(
              <>
                {Object.entries(component.model).map(([moduleName, label]) => (
                  <ElFormItem label={label}>
                    <ElInput v-model={state.editData.model[moduleName]} />
                  </ElFormItem>
                ))}
              </>
            )
          }
        }
      }
      return (
        <div class="visual-editor-operator">
          <ElForm labelPosition="top">
            {content}
            <ElFormItem>
              <ElButton {...{ onClick: methods.apply } as any}>应用</ElButton>
              <ElButton {...{ onClick: methods.reset } as any}>重置</ElButton>
            </ElFormItem>
          </ElForm>
        </div>
      )
    }
  }
})