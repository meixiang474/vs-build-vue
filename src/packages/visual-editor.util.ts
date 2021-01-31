import { VisualEditorProps } from './utils/visual-editor-props';
export interface VisualEditorBlockData {
  componentKey: string;
  top: number;
  left: number;
  adjustPosition: boolean;
  focus: boolean;
  zIndex: number;
  width: number;
  height: number;
  hasResize: boolean;
  props: Record<string, any>;
}

export interface VisualEditorModelValue {
  container: {
    width: number;
    height: number;
  };
  blocks?: VisualEditorBlockData[];
}

export interface VisualEditorComponent {
  key: string;
  label: string;
  preview: () => JSX.Element;
  render: (data: { props: any }) => JSX.Element;
  props?: Record<string, VisualEditorProps>;
}

export interface VisualEditorMarkLines {
  x: { left: number; showLeft: number }[];
  y: { top: number; showTop: number }[];
}

export function createNewBlock({
  component,
  left,
  top,
}: {
  component: VisualEditorComponent;
  top: number;
  left: number;
}): VisualEditorBlockData {
  let width: number, height: number;
  return {
    top,
    left,
    componentKey: component.key,
    adjustPosition: true,
    focus: false,
    zIndex: 0,
    width: 0,
    height: 0,
    hasResize: false,
    props: {},
  };
}

export function createVisualEditorConfig() {
  const componentList: VisualEditorComponent[] = [];
  const componentMap: Record<string, VisualEditorComponent> = {};
  return {
    componentMap,
    componentList,
    registry: <Props extends Record<string, VisualEditorProps>>(
      key: string,
      component: {
        label: string;
        preview: () => JSX.Element;
        render: (data: { props: { [k in keyof Props]: any } }) => JSX.Element;
        props?: Props;
      }
    ) => {
      const comp = { ...component, key };
      componentList.push(comp);
      componentMap[key] = comp;
    },
  };
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>;
