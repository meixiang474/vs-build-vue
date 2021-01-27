import { reactive } from 'vue';

export interface CommandExecute {
  undo?: () => void;
  redo?: () => void;
}

export interface Command {
  name: string;
  keyboard?: string | string[];
  execute: (...args: any[]) => CommandExecute;
  followQueue?: boolean;
}

export function useCommander() {
  const state = reactive({
    current: -1,
    queue: [] as CommandExecute[],
    commands: {} as Record<string, (...args: any[]) => void>,
  });
  const registry = (command: Command) => {
    state.commands[command.name] = (...args) => {
      const { undo, redo } = command.execute(...args);
      if (command.followQueue !== false) {
        state.queue.push({ undo, redo });
        state.current += 1;
      }
      redo!();
    };
  };
  registry({
    name: 'undo',
    keyboard: 'ctrl+z',
    followQueue: false,
    execute: () => {
      return {
        redo: () => {
          if (state.current === -1) return;
          const queueItem = state.queue[state.current];
          if (queueItem) {
            queueItem.undo && queueItem.undo();
            state.current--;
          }
        },
      };
    },
  });

  registry({
    name: 'redo',
    keyboard: ['ctrl+y', 'ctrl+shift+z'],
    followQueue: false,
    execute: () => {
      return {
        redo: () => {
          const queueItem = state.queue[state.current + 1];
          if (queueItem) {
            queueItem.redo!();
            state.current++;
          }
        },
      };
    },
  });

  return {
    state,
    registry,
  };
}
