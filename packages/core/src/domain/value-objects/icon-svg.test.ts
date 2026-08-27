import { describe, expect, it } from 'vitest';

import { ICON_SVG_VIOLATIONS, InvalidIconSvgError } from '../errors/invalid-icon-svg-error.ts';
import * as ICON_SVG_CONSTANTS from '../constants/icon-svg.ts';
import { IconSvg } from './icon-svg.ts';

/** The shape the seed authors: a stroke icon that inherits `currentColor`. */
const VALID =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"' +
  ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
  ' stroke-linejoin="round"><path d="M4 4h16v16H4z"/></svg>';

function violationOf(markup: string): string {
  try {
    IconSvg.create(markup);
  } catch (error) {
    if (error instanceof InvalidIconSvgError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${markup} to be rejected, and it was not.`);
}

describe('IconSvg', () => {
  it('accepts a stroke icon drawn with currentColor', () => {
    expect(IconSvg.create(VALID).toString()).toBe(VALID);
  });

  it('accepts every whitelisted shape element', () => {
    const shapes =
      '<g><path d="M0 0"/><circle cx="1" cy="1" r="1"/><rect x="0" y="0" width="2" height="2"/>' +
      '<line x1="0" y1="0" x2="1" y2="1"/><polyline points="0,0 1,1"/>' +
      '<polygon points="0,0 1,1 2,0"/></g>';

    expect(() => IconSvg.create(`<svg viewBox="0 0 24 24">${shapes}</svg>`)).not.toThrow();
  });

  /*
   * One test per rejection, as testing.md asks of this value object: it is the
   * NFR-07 boundary, and a single test asserting "invalid markup throws" would
   * pass with every rule but one removed.
   */
  it('rejects a script element', () => {
    expect(violationOf('<svg><script>alert(1)</script></svg>')).toBe(
      ICON_SVG_VIOLATIONS.DISALLOWED_TAG,
    );
  });

  it('rejects an event handler attribute', () => {
    expect(violationOf('<svg onload="alert(1)"><path d="M0 0"/></svg>')).toBe(
      ICON_SVG_VIOLATIONS.EVENT_HANDLER,
    );
  });

  it('rejects an event handler the whitelist was never written against', () => {
    expect(violationOf('<svg><circle cx="1" cy="1" r="1" onpointerrawupdate="x()"/></svg>')).toBe(
      ICON_SVG_VIOLATIONS.EVENT_HANDLER,
    );
  });

  it('rejects a non-whitelisted tag', () => {
    expect(violationOf('<svg><foreignObject><b>hi</b></foreignObject></svg>')).toBe(
      ICON_SVG_VIOLATIONS.DISALLOWED_TAG,
    );
  });

  it('rejects a non-whitelisted attribute', () => {
    expect(violationOf('<svg><path d="M0 0" href="https://example.com"/></svg>')).toBe(
      ICON_SVG_VIOLATIONS.DISALLOWED_ATTRIBUTE,
    );
  });

  it('rejects a style attribute, which can fetch', () => {
    expect(violationOf('<svg style="background:url(https://example.com)"/>')).toBe(
      ICON_SVG_VIOLATIONS.DISALLOWED_ATTRIBUTE,
    );
  });

  it('rejects markup that is not rooted in an svg element', () => {
    expect(violationOf('<path d="M0 0"/>')).toBe(ICON_SVG_VIOLATIONS.NOT_ROOTED_IN_SVG);
  });

  it('rejects a second element beside the root', () => {
    expect(violationOf('<svg><path d="M0 0"/></svg><svg/>')).toBe(
      ICON_SVG_VIOLATIONS.NOT_ROOTED_IN_SVG,
    );
  });

  it('rejects text sitting outside the svg element', () => {
    expect(violationOf('<svg><path d="M0 0"/></svg>trailing')).toBe(
      ICON_SVG_VIOLATIONS.NOT_ROOTED_IN_SVG,
    );
  });

  it('rejects text content', () => {
    expect(violationOf('<svg>hello</svg>')).toBe(ICON_SVG_VIOLATIONS.MALFORMED);
  });

  it('rejects a comment, which can hide markup from a naive scan', () => {
    expect(violationOf('<svg><!-- <script>alert(1)</script> --></svg>')).toBe(
      ICON_SVG_VIOLATIONS.MALFORMED,
    );
  });

  it('rejects an unclosed element', () => {
    expect(violationOf('<svg><path d="M0 0">')).toBe(ICON_SVG_VIOLATIONS.MALFORMED);
  });

  it('rejects a close tag that was never opened', () => {
    expect(violationOf('<svg></path></svg>')).toBe(ICON_SVG_VIOLATIONS.MALFORMED);
  });

  /*
   * The closes balance, so a scan counting depth alone ends on zero and lets
   * this through — markup whose elements do not nest is markup the browser is
   * free to reinterpret.
   */
  it('rejects a close tag that does not close the element it sits in', () => {
    expect(violationOf('<svg><path></svg></path>')).toBe(ICON_SVG_VIOLATIONS.MALFORMED);
  });

  /*
   * The tokenizer honours quotes, so this `>` does not end the tag. A scan
   * that split on `>` would see `<svg fill="` as a complete element and treat
   * the handler that follows as text.
   */
  it('does not let a > inside an attribute value end the tag early', () => {
    expect(violationOf('<svg fill="a>b" onload="alert(1)"></svg>')).toBe(
      ICON_SVG_VIOLATIONS.EVENT_HANDLER,
    );
  });

  it('rejects a javascript: scheme in an allowed attribute', () => {
    expect(violationOf('<svg fill="javascript:alert(1)"/>')).toBe(
      ICON_SVG_VIOLATIONS.DENIED_SCHEME,
    );
  });

  it('rejects a javascript: scheme broken up by whitespace', () => {
    expect(violationOf('<svg fill="java\nscript:alert(1)"/>')).toBe(
      ICON_SVG_VIOLATIONS.DENIED_SCHEME,
    );
  });

  it('rejects markup over its length budget', () => {
    const long = `<svg>${'<path d="M0 0"/>'.repeat(ICON_SVG_CONSTANTS.MAX_LENGTH)}</svg>`;

    expect(violationOf(long)).toBe(ICON_SVG_VIOLATIONS.OVER_BUDGET);
  });

  it('rejects a blank icon', () => {
    expect(violationOf('   ')).toBe(ICON_SVG_VIOLATIONS.EMPTY);
  });

  it('rejects a value that is not a string', () => {
    expect(() => IconSvg.create(null)).toThrow(InvalidIconSvgError);
  });

  it('compares by markup', () => {
    expect(IconSvg.create(VALID).equals(IconSvg.create(VALID))).toBe(true);
    expect(IconSvg.create(VALID).equals(IconSvg.create('<svg><path d="M0 0"/></svg>'))).toBe(false);
  });
});
