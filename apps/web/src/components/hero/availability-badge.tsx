import type { AvailabilityCopy } from '../../content/types';
import styles from './availability-badge.module.css';

/**
 * The availability badge (FR-02).
 *
 * The boolean arrives as a prop rather than being read from `content/site.ts`
 * here: a component that reaches for a module constant can only ever render
 * one of its two states, and the state it does not render is the one that goes
 * wrong. The composition root passes `AVAILABLE_FOR_WORK`.
 *
 * The icon is decorative — the badge already says in words what it means — so
 * it is hidden from the accessibility tree rather than given a name that would
 * be announced twice.
 */
export function AvailabilityBadge({
  copy,
  available,
}: {
  readonly copy: AvailabilityCopy;
  readonly available: boolean;
}) {
  return (
    <p className={styles.badge} data-available={available}>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.2 4.2l4.2 4.2M15.5 15.5l4.2 4.2M1 12h6M17 12h6M4.2 19.8l4.2-4.2M15.5 8.5l4.2-4.2" />
        </svg>
      </span>
      {available ? copy.open : copy.closed}
    </p>
  );
}
