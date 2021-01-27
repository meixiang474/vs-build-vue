import { useCommander } from '../plugins/command.plugin';
import { VisualEditorBlockData, VisualEditorModelValue } from '../visual-editor.util';
import deepcopy from 'deepcopy'

export function useVisualCommand({ focusData, updateBlocks, dataModel, dragstart, dragend }: {
  focusData: {
    value: { focus: VisualEditorBlockData[]; unFocus: VisualEditorBlockData[] };
  };
  updateBlocks: (blocks: VisualEditorBlockData[]) => void;
  dataModel: { value: VisualEditorModelValue };
  dragstart: { on: (cb: () => void) => void; off: (cb: () => void) => void };
  dragend: { on: (cb: () => void) => void; off: (cb: () => void) => void };
}) {
  const commander = useCommander()
  commander.registry({
    name: 'delete',
    keyboard: [
      'backspace',
      'delete',
      'ctrl+d'
    ],
    execute: () => {
      const data = {
        before: dataModel.value.blocks || [],
        after: focusData.value.unFocus
      }
      return {
        redo: () => {
          updateBlocks(deepcopy(data.after))
        },
        undo: () => {
          updateBlocks(deepcopy(data.before))
        },
      }
    }
  })

  commander.registry({
    name: 'drag',
    init() {
      this.data = { before: null as null | VisualEditorBlockData[] }
      const handler = {
        dragstart: () => {
          this.data.before = deepcopy(dataModel.value.blocks || [])
        },
        dragend: () => {
          commander.state.commands.drag()
        }
      }
      dragstart.on(handler.dragstart)
      dragend.on(handler.dragend)
      return () => {
        dragstart.off(handler.dragstart)
        dragend.off(handler.dragend)
      }
    },
    execute() {
      const before = this.data.before
      const after = deepcopy(dataModel.value.blocks || [])
      return {
        redo: () => {
          updateBlocks(deepcopy(after))
        },
        undo: () => {
          updateBlocks(deepcopy(before))
        },

      }
    }
  })
  commander.init()
  return {
    undo: () => commander.state.commands.undo(),
    redo: () => commander.state.commands.redo(),
    delete: () => commander.state.commands.delete()
  }
}