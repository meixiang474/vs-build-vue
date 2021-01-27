export interface VisualEditorBlockData {
  componentKey: string;
  top: number;
  left: number;
  adjustPosition: boolean;
  focus: boolean;
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
  render: () => JSX.Element;
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
  return {
    top,
    left,
    componentKey: component.key,
    adjustPosition: true,
    focus: false,
  };
}

export function createVisualEditorConfig() {
  const componentList: VisualEditorComponent[] = [];
  const componentMap: Record<string, VisualEditorComponent> = {};
  return {
    componentMap,
    componentList,
    registry: (key: string, component: Omit<VisualEditorComponent, 'key'>) => {
      const comp = { ...component, key };
      componentList.push(comp);
      componentMap[key] = comp;
    },
  };
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>;
