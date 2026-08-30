const CENTER_LINE_RATIO = 0.5;
const DEFAULT_ACTIVE_INDEX = 0;

/**
 * Which of `ids`' elements is "active" — the last one, scanning top to
 * bottom, whose top has crossed the viewport's vertical centre.
 *
 * Mirrors the prototype's own per-element sweep. `SectionIndex` used to
 * derive its active section from whole-document scroll progress divided into
 * equal slices, which assumes every section is the same height — true enough
 * while hero, band and closing were the only three, and false the moment a
 * projects section several cards tall sits between them: the band's slice
 * shifts later than the band itself does, so the index reports the section
 * after it while the band is still centred on screen. Measuring actual
 * element position has no such assumption to break.
 */
export function computeActiveSectionIndex(ids: readonly string[]): number {
  if (typeof document === 'undefined') {
    return DEFAULT_ACTIVE_INDEX;
  }

  const centerLine = window.innerHeight * CENTER_LINE_RATIO;
  let active = DEFAULT_ACTIVE_INDEX;

  ids.forEach((id, index) => {
    const element = document.getElementById(id);

    if (element !== null && element.getBoundingClientRect().top < centerLine) {
      active = index;
    }
  });

  return active;
}
