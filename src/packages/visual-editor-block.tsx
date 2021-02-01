import { computed, defineComponent, getCurrentInstance, onMounted, PropType, ref } from 'vue';
import { VisualEditorBlockData, VisualEditorConfig } from './visual-editor.util'

export const VisualEditorBlock = defineComponent({
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData>,
      required: true
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    },
    onMousedown: {
      type: Function as PropType<(e: MouseEvent) => void>
    },
    formData: {
      type: Object as PropType<Record<string, any>>,
      required: true
    }
  },
  setup(props) {
    const el = ref({} as HTMLDivElement)
    const ctx = getCurrentInstance()!
    const classes = computed(() => [
      'visual-editor-block',
      { 'visual-editor-block-focus': props.block.focus }
    ])

    const styles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: props.block.zIndex,
    }))

    onMounted(() => {
      const { block } = props
      if (block.adjustPosition === true) {
        const { offsetWidth, offsetHeight } = el.value
        block.left -= offsetWidth / 2
        block.top -= offsetHeight / 2
        block.height = offsetHeight
        block.width = offsetWidth
        block.adjustPosition = false
      }
    })

    return () => {
      const component = props.config.componentMap[props.block.componentKey]
      const formData = props.formData
      const Render = component.render({
        props: props.block.props || {}, model: Object.keys(component.model || {}).reduce((memo, propName) => {
          const modelName = !props.block.model ? null : props.block.model[propName]
          memo[propName] = {
            [propName === 'default' ? 'modelValue' : propName]: modelName ? props.formData[modelName] : null,
            [propName === 'default' ? 'onUpdate:modelValue' : 'onChange']: (val: any) => {
              if (modelName) {
                formData[modelName] = val
              }
            }
          }
          return memo
        }, {} as Record<string, any>)
      })
      return (
        <div class={classes.value} style={styles.value} ref={el} onMousedown={props.onMousedown}>
          {Render}
        </div>
      )
    }
  }
})