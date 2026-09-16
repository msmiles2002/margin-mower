import logoUrl from '../assets/bomdata-logo.png';

type Child = Node | string;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { className?: string; text?: string } = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className !== undefined) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  node.append(...children);
  return node;
}

export function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', { className: `btn ${className}`, text: label });
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

export function link(label: string, className: string, href: string): HTMLAnchorElement {
  const node = el('a', { className, text: label });
  node.href = href;
  node.target = '_blank';
  node.rel = 'noopener';
  return node;
}

// A label/value line. `valueClass` styles the value: 's' (stars, default), 'value', 'check' or 'cross'.
export function row(label: Child, value: string, valueClass = 's'): HTMLDivElement {
  return el('div', { className: 'row' }, [el('span', {}, [label]), el('span', { className: valueClass, text: value })]);
}

// The BomData logo, linking to the BomData site.
export function logo(href: string, small = false): HTMLAnchorElement {
  const image = el('img');
  image.src = logoUrl;
  image.alt = 'BomData';
  const node = link('', small ? 'logo small' : 'logo', href);
  node.append(image);
  return node;
}

// Replaces the overlay with a panel and focuses its first button so Enter/Space works.
export function showPanel(overlay: HTMLElement, children: Child[], className = 'panel'): HTMLDivElement {
  const panel = el('div', { className }, children);
  overlay.replaceChildren(panel);
  // preventScroll: iOS Safari otherwise scrolls the whole page to the button, pushing the panel's top off screen.
  panel.querySelector('button')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  return panel;
}

// Resolves when a button inside `panel` created with `onClick: done` is pressed; clears the overlay.
export function waitFor<T>(overlay: HTMLElement, build: (done: (value: T) => void) => Child[], className = 'panel'): Promise<T> {
  return new Promise((resolve) => {
    showPanel(
      overlay,
      build((value) => {
        overlay.replaceChildren();
        resolve(value);
      }),
      className,
    );
  });
}

// Renders "a **bold** b" as text with a <b> element.
export function withBold(value: string): Child[] {
  return value.split('**').map((part, i) => (i % 2 === 1 ? el('b', { text: part }) : part));
}
