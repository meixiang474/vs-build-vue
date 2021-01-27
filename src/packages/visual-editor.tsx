import { computed, defineComponent, PropType, ref } from 'vue';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editor-block';
import './visual-editor.scss'
import { createNewBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorModelValue } from './visual-editor.util';
import { useVisualCommand } from './utils/visual.command'
import { createEvent } from './plugins/event';

export const VisualEditor = defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<VisualEditorModelValue>,
      required: true
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    }
  },
  emits: {
    'update:modelValue': (val?: VisualEditorModelValue) => true
  },
  setup(props, ctx) {

    const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val))

    const containerRef = ref({} as HTMLDivElement)

    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`
    }))

    const focusData = computed(() => {
      const focus: VisualEditorBlockData[] = [];
      const unFocus: VisualEditorBlockData[] = [];
      (dataModel.value.blocks || []).forEach((block) => {
        (block.focus ? focus : unFocus).push(block)
      })
      return {
        focus,
        unFocus
      }
    })

    const dragstart = createEvent()
    const dragend = createEvent()

    // dragstart.on(() => {
    //   console.log('dragstart')
    // })

    // dragend.on(() => {
    //   console.log('dragend')
    // })

    const methods = {
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = dataModel.value.blocks || []
        if (blocks.length === 0) return
        if (block) {
          blocks = blocks.filter(item => item !== block)
        }
        blocks.forEach(block => block.focus = false)
      },
      updateBlocks: (blocks: VisualEditorBlockData[]) => {
        dataModel.value = {
          ...dataModel.value,
          blocks
        }
      }
    }

    const menuDragger = (() => {
      let current = null as null | VisualEditorComponent
      const containerHandler = {
        dragenter: (e: DragEvent) => {
          e.dataTransfer!.dropEffect = 'move'
        },
        dragover: (e: DragEvent) => {
          e.preventDefault()
        },
        dragleave: (e: DragEvent) => {
          e.dataTransfer!.dropEffect = 'none'
        },
        drop: (e: DragEvent) => {
          const blocks = [...(dataModel.value.blocks || [])]
          blocks.push(createNewBlock({
            component: current!,
            left: e.offsetX,
            top: e.offsetY
          }))
          methods.updateBlocks(blocks)
          dragend.emit()
        }
      }
      const blockHandler = {
        dragstart: (e: DragEvent, component: VisualEditorComponent) => {
          containerRef.value.addEventListener('dragenter', containerHandler.dragenter)
          containerRef.value.addEventListener('dragover', containerHandler.dragover)
          containerRef.value.addEventListener('dragleave', containerHandler.dragleave)
          containerRef.value.addEventListener('drop', containerHandler.drop)
          current = component
          dragstart.emit()
        },
        dragend: () => {
          containerRef.value.removeEventListener('dragenter', containerHandler.dragenter)
          containerRef.value.removeEventListener('dragover', containerHandler.dragover)
          containerRef.value.removeEventListener('dragleave', containerHandler.dragleave)
          current = null
        },
      }
      return blockHandler
    })()

    const blockDragger = (() => {
      let dragState = {
        startX: 0,
        startY: 0,
        startPos: [] as { left: number; top: number }[],
        dragging: false
      }
      const mousemove = (e: MouseEvent) => {
        const durX = e.clientX - dragState.startX
        const durY = e.clientY - dragState.startY
        if (!dragState.dragging) {
          dragState.dragging = true
          dragstart.emit()
        }
        focusData.value.focus.forEach((block, index) => {
          block.top = dragState.startPos[index].top + durY
          block.left = dragState.startPos[index].left + durX
        })
      }
      const mouseup = () => {
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        if (dragState.dragging) {
          dragend.emit()
        }
      }
      const mousedown = (e: MouseEvent) => {
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
          dragging: false
        }
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
      }
      return { mousedown }
    })()

    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            e.stopPropagation()
            e.preventDefault()
            methods.clearFocus()
          }
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData) => {
            e.stopPropagation()
            e.preventDefault()
            if (e.shiftKey) {
              if (focusData.value.focus.length <= 1) {
                block.focus = true
              } else {
                block.focus = !block.focus
              }
            } else {
              if (!block.focus) {
                block.focus = true
                methods.clearFocus(block)
              }
            }
            blockDragger.mousedown(e)
          }
        }
      }
    })()

    const commander = useVisualCommand({
      focusData,
      updateBlocks: methods.updateBlocks,
      dataModel,
      dragstart,
      dragend
    })

    const buttons = [
      {
        label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z'
      },
      { label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y, ctrl+shift+z' },
      { label: '删除', icon: 'icon-delete', handler: () => commander.delete(), tip: 'ctrl+d, backspace, delete' }
    ]

    return () => (
      <div class="visual-editor">
        <div class="visual-editor-menu">
          {props.config.componentList.map((component) => <div
            class="visual-editor-menu-item"
            draggable
            onDragend={menuDragger.dragend}
            onDragstart={(e) => menuDragger.dragstart(e, component)}
          >
            <span class="visual-editor-menu-item-label">{component.label}</span>
            {component.preview()}
          </div>)}
        </div>
        <div class="visual-editor-head">
          {buttons.map((btn, index) => (
            <div
              key={index} class="visual-editor-head-button"
              onClick={btn.handler}
            >
              <i class={`iconfont ${btn.icon}`} />
              <span>{btn.label}</span>
            </div>
          ))}
        </div>
        <div class="visual-editor-operator">
          visual-editor-operator
        </div>
        <div class="visual-editor-body">
          <div class="visual-editor-content">
            <div class="visual-editor-container"
              style={containerStyles.value}
              ref={containerRef}
              {...focusHandler.container}
            >
              {dataModel.value.blocks && dataModel.value.blocks.map((block, index) => (
                <VisualEditorBlock
                  config={props.config}
                  block={block}
                  key={index}
                  {...{
                    onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
})