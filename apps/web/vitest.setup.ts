import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Testing Library auto-cleans only when Vitest runs with `globals: true`. It
 * does not here, so without this every `render` in a file stacks into the same
 * document and the second query finds two of everything.
 */
afterEach(cleanup);

/**
 * jsdom implements no media queries at all — `window.matchMedia` is simply
 * absent, and a component that asks whether the visitor wants less motion
 * throws rather than getting an answer. The default here is "no preference",
 * which is what most visitors send; a test about reduced motion overrides it.
 */
if (typeof window !== 'undefined' && window.matchMedia === undefined) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

/**
 * jsdom has no 2D canvas either: calling `getContext` logs a "not implemented"
 * error through its virtual console for every test that renders one. The
 * components already treat a missing context as "paint nothing", so returning
 * `null` here is the same answer without the noise. A test that cares about
 * the drawing calls stubs this itself.
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as HTMLCanvasElement['getContext'];
}

/**
 * `next/font/google` is a build-time transform the Next compiler performs, not
 * a runtime module — calling it under Vitest throws. The tests care about what
 * the layout does with the returned class name, not about the font pipeline, so
 * a stub returning a stable variable is the whole contract.
 */
vi.mock('next/font/google', () => ({
  Inter_Tight: () => ({ variable: 'font-sans', className: 'font-sans' }),
  Newsreader: () => ({ variable: 'font-serif', className: 'font-serif' }),
}));

/**
 * jsdom 25 ships `<dialog>` as an element but not as a dialog: `showModal` and
 * `close` are simply absent, so a component that opens one throws here while
 * working in every browser.
 *
 * This is the smallest stub that keeps the observable contract — `open`
 * reflects the state, and `close()` fires the `close` event React's `onClose`
 * listens for. What it deliberately does *not* emulate is the focus trap, the
 * inert backdrop or Escape-to-close: those are the browser's, and a fake of
 * them would let a test assert behaviour this code does not implement. What
 * the component owns and a test can therefore check is that it opens the
 * dialog, that closing clears the state, and that focus returns to the trigger.
 */
if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal === undefined) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
