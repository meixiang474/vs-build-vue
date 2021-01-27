import { onUnmounted, reactive } from 'vue';

export interface CommandExecute {
  undo?: () => void;
  redo: () => void;
}

export interface Command {
  name: string;
  keyboard?: string | string[];
  execute: (...args: any[]) => CommandExecute;
  followQueue?: boolean;
  init?: () => (() => void) | undefined;
  data?: any;
}

export function useCommander() {
  const state = reactive({
    current: -1,
    queue: [] as CommandExecute[],
    commandArray: [] as Command[],
    commands: {} as Record<string, (...args: any[]) => void>,
    destroyList: [] as ((() => void) | undefined)[],
  });
  const registry = (command: Command) => {
    state.commandArray.push(command);
    state.commands[command.name] = (...args) => {
      const { undo, redo } = command.execute(...args);
      redo!();
      if (command.followQueue === false) {
        return;
      }
      let { queue } = state;
      const { current } = state;
      if (queue.length > 0) {
        queue = queue.slice(0, current + 1);
        state.queue = queue;
      }
      queue.push({ undo, redo });
      state.current = current + 1;
    };
  };

  const init = () => {
    const onKeydown = (e: KeyboardEvent) => {
      console.log('监听到键盘事件');
    };
    window.addEventListener('keydown', onKeydown);
    state.commandArray.forEach(
      (command) => command.init && state.destroyList.push(command.init())
    );
    state.destroyList.push(() =>
      window.removeEventListener('keydown', onKeydown)
    );
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

  onUnmounted(() => {
    state.destroyList.forEach((fn) => fn && fn());
  });

  return {
    state,
    registry,
    init,
  };
}
