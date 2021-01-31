import { createVisualEditorConfig } from './visual-editor.util'
import { ElButton, ElInput, ElSelect, ElOption } from 'element-plus'
import { createEditorInputProp, createEditorColorProp, createEditorSelectProp, createEditorTableProp } from './utils/visual-editor-props'

export const visualConfig = createVisualEditorConfig()
visualConfig.registry('text', {
  label: '文本',
  preview: () => '预览文本',
  render: ({ props }) => <span style={{ color: props.color, fontSize: props.size }}>{props.text || '默认文本'}</span>,
  props: {
    text: createEditorInputProp('显示文本'),
    color: createEditorColorProp('字体颜色'),
    size: createEditorSelectProp('字体大小', [
      { label: '14px', val: '14px' },
      { label: '18px', val: '18px' },
      { label: '24px', val: '24px' }
    ])
  }
})
visualConfig.registry('button', {
  label: '按钮',
  preview: () => <ElButton>按钮</ElButton>,
  render: ({ props }) => <ElButton type={props.type} size={props.size}>{props.text || '按钮'}</ElButton>,
  props: {
    text: createEditorInputProp('显示文本'),
    type: createEditorSelectProp('按钮类型', [
      { val: '', label: '默认' },
      { val: 'primary', label: '基础' },
      { val: 'success', label: '成功' },
      { val: 'warning', label: '警告' },
      { val: 'danger', label: '危险' },
      { val: 'info', label: '提示' },
      { val: 'text', label: '文本' },
    ]),
    size: createEditorSelectProp('按钮大小', [
      { label: '默认', val: '' },
      { label: '中等', val: 'medium' },
      { label: '小', val: 'small' },
      { label: '极小', val: 'mini' },
    ])
  }
})

visualConfig.registry('select', {
  label: '下拉框',
  preview: () => <ElSelect />,
  render: ({ props }) => <ElSelect>
    {(props.options || []).map((opt: { label: string; value: string }, index: number) => (
      <ElOption label={opt.label} value={opt.value} key={index} />
    ))}
  </ElSelect>,
  props: {
    options: createEditorTableProp('下拉选项', {
      options: [
        { label: '显示值', field: 'label' },
        { label: '绑定值', field: 'value' },
      ],
      showKey: 'label'
    })
  }
})

visualConfig.registry('input', {
  label: '输入框',
  preview: () => <ElInput />,
  render: () => <ElInput />
})