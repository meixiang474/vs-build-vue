import { createVisualEditorConfig } from './visual-editor.util'
import { ElButton, ElInput, ElSelect, ElOption } from 'element-plus'
import { createEditorInputProp, createEditorColorProp, createEditorSelectProp, createEditorTableProp } from './utils/visual-editor-props'
import { NumberRange } from './component/numberRange'
import './visual.config.scss'

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
  },
})
visualConfig.registry('button', {
  label: '按钮',
  preview: () => <ElButton>按钮</ElButton>,
  render: ({ props, size, custom }) => (
    <ElButton {...custom} type={props.type} size={props.size} style={{
      height: `${size.height}px`,
      width: `${size.width}px`
    }}>
      {props.text || '按钮'}
    </ElButton>
  ),
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
  },
  resize: {
    height: true,
    width: true
  }
})

visualConfig.registry('select', {
  label: '下拉框',
  preview: () => <ElSelect />,
  render: ({ props, model, custom }) => (
    <ElSelect {...custom} key={(props.options || []).map((opt: any) => opt.value).join('')} {...model.default}>
      {(props.options || []).map((opt: { label: string; value: string }, index: number) => (
        <ElOption label={opt.label} value={opt.value} key={index} />
      ))}
    </ElSelect>
  ),
  props: {
    options: createEditorTableProp('下拉选项', {
      options: [
        { label: '显示值', field: 'label' },
        { label: '绑定值', field: 'value' },
      ],
      showKey: 'label'
    })
  },
  model: {
    default: '绑定字段'
  }
})

visualConfig.registry('input', {
  label: '输入框',
  preview: () => <ElInput />,
  render: ({ model, size, custom }) => <ElInput {...custom} {...model.default} style={{ width: `${size.width}px` }} />,
  model: {
    default: '绑定字段'
  },
  resize: {
    width: true
  }
})

visualConfig.registry('numberRange', {
  label: "数字范围输入框",
  preview: () => <NumberRange style={{ width: '100%' }} />,
  render: ({ model, size }) => {
    return <NumberRange {...{
      start: model.start.start,
      'onUpdate:start': model.start.onChange,
      end: model.end.end,
      'onUpdate:end': model.end.onChange
    }} style={{ width: `${size.width}px` }} />
  },
  model: {
    start: '起始绑定值字段',
    end: '截止绑定字段'
  },
  resize: {
    width: true
  }
})

visualConfig.registry('image', {
  label: '图片',
  resize: {
    width: true,
    height: true,
  },
  render: ({ props, size }) => {
    return (
      <div style={{ height: `${size.height || 100}px`, width: `${size.width || 100}px` }} class="visual-block-image">
        <img src={props.url || 'https://cn.vuejs.org/images/logo.png'} />
      </div>
    )
  },
  preview: () => (
    <div style="text-align:center;">
      <div style="font-size:20px;background-color:#f2f2f2;color:#ccc;display:inline-flex;width:100px;height:50px;align-items:center;justify-content:center">
        <i class="el-icon-picture" />
      </div>
    </div>
  ),
  props: {
    url: createEditorInputProp('地址')
  },
})
