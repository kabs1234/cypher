type Child = Node | string | false | null | undefined;

export type ElementOptions = {
  readonly className?: string;
  readonly text?: string;
  readonly attributes?: Readonly<Record<string, string>>;
  readonly style?: Readonly<Record<string, string>>;
  readonly onClick?: () => void;
  readonly children?: ReadonlyArray<Child>;
};

export function createElement<TTag extends keyof HTMLElementTagNameMap>(
  tag: TTag,
  options: ElementOptions = {},
): HTMLElementTagNameMap[TTag] {
  const element = document.createElement(tag);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  Object.entries(options.attributes ?? {}).forEach(([name, value]) =>
    element.setAttribute(name, value),
  );
  Object.entries(options.style ?? {}).forEach(([name, value]) =>
    element.style.setProperty(name, value),
  );
  if (options.onClick) {
    element.addEventListener('click', options.onClick);
  }
  element.append(...(options.children ?? []).filter(isPresent));
  return element;
}

function isPresent(child: Child): child is Node | string {
  return child !== false && child !== null && child !== undefined;
}
