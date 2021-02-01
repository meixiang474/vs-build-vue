import { defineComponent } from 'vue';
import { useModel } from '@/packages/utils/useModel'
import './style.scss'

export const NumberRange = defineComponent({
  props: {
    start: {
      type: String
    },
    end: {
      type: String
    }
  },
  emits: {
    'update:start': (val?: string) => true,
    'update:end': (val?: string) => true
  },
  setup(props, ctx) {
    const startModel = useModel(() => props.start, val => ctx.emit('update:start', val))
    const endModel = useModel(() => props.end, (val) => ctx.emit('update:end', val))

    return () => (
      <div class="number-range">
        <input v-model={startModel.value} />
        <span>~</span>
        <input v-model={endModel.value} />
      </div>
    )
  }
})