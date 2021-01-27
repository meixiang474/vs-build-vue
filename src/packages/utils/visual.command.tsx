import { useCommander } from '../plugins/command.plugin';
import { VisualEditorBlockData, VisualEditorModelValue } from '../visual-editor.util';

export function useVisualCommand({ focusData, updateBlocks, dataModel }: {
  focusData: {
    value: { focus: VisualEditorBlockData[]; unFocus: VisualEditorBlockData[] };
  };
  updateBlocks: (blocks: VisualEditorBlockData[]) => void;
  dataModel: { value: VisualEditorModelValue };
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
          updateBlocks(data.after)
        },
        undo: () => {
          updateBlocks(data.before)
        },
      }
    }
  })
  return {
    undo: () => commander.state.commands.undo(),
    redo: () => commander.state.commands.redo(),
    delete: () => commander.state.commands.delete()
  }
}