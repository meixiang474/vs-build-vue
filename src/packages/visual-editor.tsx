import { computed, defineComponent, PropType, ref, reactive } from 'vue';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editor-block';
import './visual-editor.scss'
import { createNewBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorMarkLines, VisualEditorModelValue } from './visual-editor.util';
import { useVisualCommand } from './utils/visual.command'
import { createEvent } from './plugins/event';
import { $$dialog } from './utils/dialog-service';
import { ElMessageBox } from 'element-plus'
import { $$dropdown } from './utils/dropdown-service'
import { VisualOperatorEditor } from './utils/visual-editor-operator';

export const VisualEditor = defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<VisualEditorModelValue>,
      required: true
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    },
    formData: {
      type: Object as PropType<Record<string, any>>,
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
    const selectIndex = ref(-1)
    const state = reactive({
      selectBlock: computed(() => (dataModel.value.blocks || [])[selectIndex.value]),
      editing: true,  // 当前是否正在编辑
      preview: false   // 当前是否关闭了编辑器
    })

    const classes = computed(() => [
      'visual-editor',
      {
        'visual-editor-editing': state.editing
      }
    ])

    const dragstart = createEvent()
    const dragend = createEvent()

    // dragstart.on(() => {
    //   console.log('dragstart')
    // })

    // dragend.on(() => {
    //   console.log('dragend')
    // })

    const methods = {
      openEdit: () => {
        state.preview = false
      },
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = dataModel.value.blocks || []
        if (blocks.length === 0) return
        if (block) {
          blocks = blocks.filter(item => item !== block)
        }
        blocks.forEach(block => block.focus = false)
      },
      updateBlocks: (blocks?: VisualEditorBlockData[]) => {
        if (blocks == null) {
          blocks = []
        }
        dataModel.value = {
          ...dataModel.value,
          blocks
        }
      },
      showBlockData: (block: VisualEditorBlockData) => {
        $$dialog.textarea(JSON.stringify(block), '节点数据', { editReadonly: true })
      },
      importBlockData: async (block: VisualEditorBlockData) => {
        const text = await $$dialog.textarea('', '请输入节点JSON字符串')
        try {
          const data = JSON.parse(text || '') as VisualEditorBlockData
          commander.updateBlock(data, block)
        } catch (e) {
          console.error(e)
        }
      }
    }

    const commander = useVisualCommand({
      focusData,
      updateBlocks: methods.updateBlocks,
      dataModel,
      dragstart,
      dragend,
    })



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
      const mark = reactive({
        x: null as null | number,
        y: null as null | number
      })
      let dragState = {
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startPos: [] as { left: number; top: number }[],
        dragging: false,
        markLines: {} as VisualEditorMarkLines
      }
      const mousemove = (e: MouseEvent) => {
        if (!dragState.dragging) {
          dragState.dragging = true
          dragstart.emit()
        }
        let { clientX: moveX, clientY: moveY } = e
        const { startX, startY } = dragState
        if (e.shiftKey) {
          if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
            moveY = startY
          } else {
            moveX = startX
          }
        }

        const currentLeft = dragState.startLeft + moveX - startX
        const currentTop = dragState.startTop + moveY - startY

        const currentMark = {
          x: null as null | number,
          y: null as null | number
        }

        for (let i = 0; i < dragState.markLines.y.length; i++) {
          const { top, showTop } = dragState.markLines.y[i]
          if (Math.abs(top - currentTop) < 5) {
            moveY = top + startY - dragState.startTop
            currentMark.y = showTop
            break
          }
        }
        for (let i = 0; i < dragState.markLines.x.length; i++) {
          const { left, showLeft } = dragState.markLines.x[i]
          if (Math.abs(left - currentLeft) < 5) {
            moveX = left + startX - dragState.startLeft
            currentMark.x = showLeft
            break
          }
        }
        mark.x = currentMark.x
        mark.y = currentMark.y

        const durX = moveX - startX
        const durY = moveY - startY
        focusData.value.focus.forEach((block, index) => {
          block.top = dragState.startPos[index].top + durY
          block.left = dragState.startPos[index].left + durX
        })
      }
      const mouseup = () => {
        mark.x = null
        mark.y = null
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
          startLeft: state.selectBlock!.left,
          startTop: state.selectBlock!.top,
          startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
          dragging: false,
          markLines: (() => {
            const { focus, unFocus } = focusData.value
            const { top, left, width, height } = state.selectBlock!
            const lines: VisualEditorMarkLines = { x: [], y: [] };
            [...unFocus, {
              top: 0,
              left: 0,
              width: dataModel.value.container.width,
              height: dataModel.value.container.height
            }].forEach(block => {
              const { top: t, left: l, width: w, height: h } = block
              lines.y.push({ top: t, showTop: t })
              lines.y.push({ top: t + h, showTop: t + h })
              lines.y.push({ top: t + h / 2 - height / 2, showTop: t + h / 2 })
              lines.y.push({ top: t - height, showTop: t })
              lines.y.push({ top: t + h - height, showTop: t + h })

              lines.x.push({ left: l, showLeft: l })
              lines.x.push({ left: l + w, showLeft: l + w })
              lines.x.push({ left: l + w / 2 - width / 2, showLeft: l + w / 2 })
              lines.x.push({ left: l - width, showLeft: l })
              lines.x.push({ left: l + w - width, showLeft: l + w })
            })
            return lines
          })()
        }
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
      }
      return { mousedown, mark }
    })()



    // 其他的一些事件处理 
    const handler = {
      onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData) => {
        if (!state.editing) return
        e.preventDefault()
        $$dropdown({
          reference: e,
          content: () => (
            <>
              <dropdown-option label="置顶节点" icon="icon-place-top" {...{ onClick: commander.placeTop }} />
              <dropdown-option label="置低节点" icon="icon-place-bottom" {...{ onClick: commander.placeBottom }} />
              <dropdown-option label="删除节点" icon="icon-delete" {...{ onClick: commander.delete }} />
              <dropdown-option label="查看数据" icon="icon-browse" {...{ onClick: () => methods.showBlockData(block) }} />
              <dropdown-option label="导入节点" icon="icon-import" {...{ onClick: () => methods.importBlockData(block) }} />
            </>
          )
        })
      }
    }

    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            if (!state.editing) return
            e.preventDefault()
            if (e.currentTarget !== e.target) {
              return
            }
            if (!e.shiftKey) {
              methods.clearFocus()
              selectIndex.value = -1
            }
          }
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData, index: number) => {
            if (!state.editing) return
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
            selectIndex.value = index
            blockDragger.mousedown(e)
          }
        }
      }
    })()



    const buttons = [
      {
        label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z'
      },
      { label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y, ctrl+shift+z' },
      {
        label: () => state.editing ? '预览' : '编辑',
        icon: () => state.editing ? 'icon-browse' : 'icon-edit',
        handler: () => {
          if (state.editing) {
            methods.clearFocus()
          }
          state.editing = !state.editing
        }
      },
      {
        label: '导入',
        icon: 'icon-import',
        handler: async () => {
          const text = await $$dialog.textarea('', '请输入导入的JSON字符串')
          try {
            const data = JSON.parse(text || '')
            dataModel.value = data
          } catch (e) {
            console.error(e)
            ElMessageBox.alert('解析JSON字符串出错')
          }
        }
      },
      {
        label: '导出',
        icon: 'icon-export',
        handler: () => $$dialog.textarea(JSON.stringify(dataModel.value), '导出的JSON数据', {
          editReadonly: true,
        })
      },
      {
        label: '置顶',
        icon: 'icon-place-top',
        handler: () => commander.placeTop(),
        tip: 'ctrl+up'
      },
      {
        label: '置底',
        icon: 'icon-place-bottom',
        handler: () => commander.placeBottom(),
        tip: 'ctrl+down'
      },
      { label: '删除', icon: 'icon-delete', handler: () => commander.delete(), tip: 'ctrl+d, backspace, delete' },
      {
        label: '清空',
        icon: 'icon-reset',
        handler: () => commander.clear(),
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          methods.clearFocus()
          state.preview = true
        }
      }
    ]

    return () => (
      <>
        <div class="visual-editor-container"
          style={containerStyles.value}
        >
          {dataModel.value.blocks && dataModel.value.blocks.map((block, index) => (
            <VisualEditorBlock
              config={props.config}
              block={block}
              key={index}
              formData={props.formData}
            />
          ))}
          <div class="vue-visual-container-edit-button" onClick={methods.openEdit}>
            <i class="iconfont icon-edit" />
            <span>编辑组件</span>
          </div>
        </div>
        <div class={classes.value} v-show={!state.preview}>
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
            {buttons.map((btn, index) => {
              const label = typeof btn.label === 'function' ? btn.label() : btn.label
              const icon = typeof btn.icon === 'function' ? btn.icon() : btn.icon
              const content = (
                <div
                  key={index} class="visual-editor-head-button"
                  onClick={btn.handler}
                >
                  <i class={`iconfont ${icon}`} />
                  <span>{label}</span>
                </div>
              )
              return btn.tip ? (
                <el-tooltip effect="dark" content={btn.tip} placement="bottom">
                  {content}
                </el-tooltip>
              ) : content
            })}
          </div>
          <div class="visual-editor-operator">
            <VisualOperatorEditor
              block={state.selectBlock}
              config={props.config}
              dataModel={dataModel}
              updateBlock={commander.updateBlock}
              updateModelValue={commander.updateModelValue}
            />
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
                    formData={props.formData}
                    onMousedown={(e: MouseEvent) => focusHandler.block.onMousedown(e, block, index)}
                    {...{
                      onContextmenu: (e: MouseEvent) => handler.onContextmenuBlock(e, block)
                    }}
                  />
                ))}
                {blockDragger.mark.y !== null && (
                  <div class="visual-editor-mark-line-y" style={{ top: `${blockDragger.mark.y}px` }}></div>
                )}
                {blockDragger.mark.x !== null && (
                  <div class="visual-editor-mark-line-x" style={{ left: `${blockDragger.mark.x}px` }}></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
})
