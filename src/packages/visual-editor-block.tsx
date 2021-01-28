import { computed, defineComponent, onMounted, PropType, ref } from 'vue';
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
    }
  },
  setup(props) {

    const el = ref({} as HTMLDivElement)

    const classes = computed(() => [
      'visual-editor-block',
      { 'visual-editor-block-focus': props.block.focus }
    ])

    const styles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: props.block.zIndex
    }))

    onMounted(() => {
      const { block } = props
      if (block.adjustPosition === true) {
        const { offsetWidth, offsetHeight } = el.value
        block.left -= offsetWidth / 2
        block.top -= offsetHeight / 2
        block.adjustPosition = false
      }
    })

    return () => {
      const component = props.config.componentMap[props.block.componentKey]
      const Render = component.render()
      return (
        <div class={classes.value} style={styles.value} ref={el}>
          {Render}
        </div>
      )
    }
  }
})