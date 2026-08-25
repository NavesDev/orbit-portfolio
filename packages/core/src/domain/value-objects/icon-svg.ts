import * as ICON_SVG_CONSTANTS from '../constants/icon-svg.ts';
import { ICON_SVG_VIOLATIONS, InvalidIconSvgError } from '../errors/invalid-icon-svg-error.ts';

const ALLOWED_TAGS = new Set(ICON_SVG_CONSTANTS.ALLOWED_TAGS);
const ALLOWED_ATTRIBUTES = new Set(ICON_SVG_CONSTANTS.ALLOWED_ATTRIBUTES);

const TAG_NAME_START = /[a-zA-Z]/;
const TAG_NAME_BODY = /[a-zA-Z0-9-]/;
const WHITESPACE = /\s/;
const WHITESPACE_EVERYWHERE = /\s/gu;
const ATTRIBUTE_NAME_END = /[\s=/>]/;

/**
 * Sanitized inline SVG markup for a social link's icon (NFR-07).
 *
 * **This is a security boundary, not a formatting rule.** `icon_svg` is
 * rendered into the page as markup so the icon can inherit `currentColor`,
 * which means a row in `social_links` is executable content the moment nobody
 * checks it. Validating on construction is what makes an unchecked value
 * impossible to hold: there is no way to obtain an `IconSvg` that was not
 * scanned, so no render path has to remember to sanitize.
 *
 * The scan is a hand-written tokenizer rather than a parser dependency because
 * `packages/core` has none (NFR-09) — and because a whitelist scan is a
 * smaller thing to be sure of than a parser configured to be strict. It reads
 * tags and attributes with quotes honoured, so a `>` inside an attribute value
 * cannot end a tag early and smuggle the rest of the markup past the check.
 */
export class IconSvg {
  private constructor(private readonly markup: string) {}

  static create(value: unknown): IconSvg {
    if (typeof value !== 'string') {
      throw new InvalidIconSvgError(
        ICON_SVG_VIOLATIONS.NOT_A_STRING,
        'An icon must be a string of SVG markup.',
      );
    }

    const markup = value.trim();

    if (markup.length === 0) {
      throw new InvalidIconSvgError(ICON_SVG_VIOLATIONS.EMPTY, 'An icon must not be blank.');
    }

    if (markup.length > ICON_SVG_CONSTANTS.MAX_LENGTH) {
      throw new InvalidIconSvgError(
        ICON_SVG_VIOLATIONS.OVER_BUDGET,
        `An icon exceeds its budget of ${ICON_SVG_CONSTANTS.MAX_LENGTH} characters.`,
      );
    }

    scan(markup);

    return new IconSvg(markup);
  }

  toString(): string {
    return this.markup;
  }

  toJSON(): string {
    return this.markup;
  }

  equals(other: IconSvg): boolean {
    return this.markup === other.markup;
  }
}

/**
 * Walks the markup once, rejecting on the first thing that is not whitelisted.
 *
 * Depth is tracked so the scan can insist the whole string is one `svg`
 * element: markup that closes its root early could carry anything after it,
 * and a check that only looked at the first tag would not notice.
 */
function scan(markup: string): void {
  let index = 0;
  let depth = 0;
  let rootSeen = false;

  while (index < markup.length) {
    const nextTag = markup.indexOf('<', index);

    if (nextTag === -1) {
      requireOnlyWhitespace(markup.slice(index), depth, rootSeen);
      break;
    }

    requireOnlyWhitespace(markup.slice(index, nextTag), depth, rootSeen);

    const tag = readTag(markup, nextTag);

    if (tag.closing) {
      depth -= 1;

      if (depth < 0) {
        throw new InvalidIconSvgError(
          ICON_SVG_VIOLATIONS.MALFORMED,
          `An icon closes </${tag.name}> that was never opened.`,
        );
      }
    } else {
      if (depth === 0) {
        requireRoot(tag.name, rootSeen);
        rootSeen = true;
      }

      if (!tag.selfClosing) {
        depth += 1;
      }
    }

    index = tag.end;
  }

  if (depth !== 0 || !rootSeen) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.MALFORMED,
      'An icon must be a single, closed <svg> element.',
    );
  }
}

function requireRoot(name: string, rootSeen: boolean): void {
  if (rootSeen) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.NOT_ROOTED_IN_SVG,
      'An icon must be a single <svg> element.',
    );
  }

  if (name !== ICON_SVG_CONSTANTS.ROOT_TAG) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.NOT_ROOTED_IN_SVG,
      `An icon must be rooted in <${ICON_SVG_CONSTANTS.ROOT_TAG}>, not <${name}>.`,
    );
  }
}

/**
 * Text between tags.
 *
 * A stroke icon has no text content, so anything but whitespace inside the
 * root is content the whitelist never described — and outside it, content
 * sitting beside the icon.
 */
function requireOnlyWhitespace(text: string, depth: number, rootSeen: boolean): void {
  if (text.trim().length === 0) {
    return;
  }

  if (depth === 0 && rootSeen) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.NOT_ROOTED_IN_SVG,
      'An icon must carry nothing outside its <svg> element.',
    );
  }

  throw new InvalidIconSvgError(
    ICON_SVG_VIOLATIONS.MALFORMED,
    'An icon must carry no text content.',
  );
}

interface Tag {
  readonly name: string;
  readonly closing: boolean;
  readonly selfClosing: boolean;
  /** The index just past the tag's `>`. */
  readonly end: number;
}

function readTag(markup: string, start: number): Tag {
  let index = start + 1;

  if (markup[index] === '!' || markup[index] === '?') {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.MALFORMED,
      'An icon must carry no comments, doctype or processing instructions.',
    );
  }

  const closing = markup[index] === '/';

  if (closing) {
    index += 1;
  }

  const nameStart = index;

  if (!TAG_NAME_START.test(markup[nameStart] ?? '')) {
    throw new InvalidIconSvgError(ICON_SVG_VIOLATIONS.MALFORMED, 'An icon has a malformed tag.');
  }

  while (TAG_NAME_BODY.test(markup[index] ?? '')) {
    index += 1;
  }

  const name = markup.slice(nameStart, index).toLowerCase();

  if (!ALLOWED_TAGS.has(name)) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.DISALLOWED_TAG,
      `<${name}> is not an allowed icon element.`,
    );
  }

  return readAttributes(markup, index, name, closing);
}

function readAttributes(markup: string, from: number, name: string, closing: boolean): Tag {
  let index = from;

  while (index < markup.length) {
    while (WHITESPACE.test(markup[index] ?? '')) {
      index += 1;
    }

    const character = markup[index];

    if (character === undefined) {
      break;
    }

    if (character === '>') {
      return { name, closing, selfClosing: false, end: index + 1 };
    }

    if (character === '/') {
      if (markup[index + 1] !== '>') {
        throw new InvalidIconSvgError(
          ICON_SVG_VIOLATIONS.MALFORMED,
          'An icon has a malformed tag.',
        );
      }

      return { name, closing, selfClosing: true, end: index + 2 };
    }

    index = readAttribute(markup, index);
  }

  throw new InvalidIconSvgError(ICON_SVG_VIOLATIONS.MALFORMED, 'An icon has an unterminated tag.');
}

/** Reads one attribute and returns the index just past its value. */
function readAttribute(markup: string, from: number): number {
  let index = from;

  while (index < markup.length && !ATTRIBUTE_NAME_END.test(markup[index] ?? '')) {
    index += 1;
  }

  const attribute = markup.slice(from, index).toLowerCase();

  /* A tag reading `<path ="x">` names no attribute — and consuming nothing here
   * would leave the scan on the same character forever. */
  if (attribute.length === 0) {
    throw new InvalidIconSvgError(ICON_SVG_VIOLATIONS.MALFORMED, 'An icon has a nameless attribute.');
  }

  if (attribute.startsWith(ICON_SVG_CONSTANTS.EVENT_HANDLER_PREFIX)) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.EVENT_HANDLER,
      `"${attribute}" is an event handler and an icon may carry none.`,
    );
  }

  if (!ALLOWED_ATTRIBUTES.has(attribute)) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.DISALLOWED_ATTRIBUTE,
      `"${attribute}" is not an allowed icon attribute.`,
    );
  }

  while (WHITESPACE.test(markup[index] ?? '')) {
    index += 1;
  }

  if (markup[index] !== '=') {
    return index;
  }

  index += 1;

  while (WHITESPACE.test(markup[index] ?? '')) {
    index += 1;
  }

  return readAttributeValue(markup, index, attribute);
}

function readAttributeValue(markup: string, from: number, attribute: string): number {
  const quote = markup[from];
  let index = from;
  let value: string;

  if (quote === '"' || quote === "'") {
    const close = markup.indexOf(quote, from + 1);

    if (close === -1) {
      throw new InvalidIconSvgError(
        ICON_SVG_VIOLATIONS.MALFORMED,
        `"${attribute}" has an unterminated value.`,
      );
    }

    value = markup.slice(from + 1, close);
    index = close + 1;
  } else {
    while (index < markup.length && !ATTRIBUTE_NAME_END.test(markup[index] ?? '')) {
      index += 1;
    }

    value = markup.slice(from, index);
  }

  requireAllowedScheme(value, attribute);

  return index;
}

/**
 * The value's scheme, with whitespace stripped before the check.
 *
 * A URL written with a newline inside its scheme is one browsers have
 * historically honoured, so comparing the raw prefix would miss it.
 */
function requireAllowedScheme(value: string, attribute: string): void {
  const normalized = value.replaceAll(WHITESPACE_EVERYWHERE, '').toLowerCase();

  for (const scheme of ICON_SVG_CONSTANTS.DENIED_VALUE_SCHEMES) {
    if (normalized.startsWith(scheme)) {
      throw new InvalidIconSvgError(
        ICON_SVG_VIOLATIONS.DENIED_SCHEME,
        `"${attribute}" names the "${scheme}" scheme, which an icon may not.`,
      );
    }
  }
}
