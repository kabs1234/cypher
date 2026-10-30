import type { Status, TermType } from '../../../frontend/src/api/types';
import { createElement } from './dom';

const TERM_TYPE_LABELS: Readonly<Record<TermType, string>> = {
  slang: 'Slang',
  person: 'Person',
  place: 'Place',
  event: 'Event',
  brand: 'Brand',
  religion: 'Religion',
  other: 'Other',
};

export function createTypeTag(type: TermType): HTMLSpanElement {
  return createElement('span', {
    className: 'cypher-type',
    text: TERM_TYPE_LABELS[type],
    style: { '--cypher-type-color': `var(--cypher-type-${type})` },
  });
}

export function createStatusBadge(status: Status): HTMLSpanElement {
  if (status === 'verified') {
    return createElement('span', {
      className: 'cypher-status cypher-status-verified',
      text: 'Verified',
    });
  }
  return createElement('span', {
    className: 'cypher-status cypher-status-draft',
    children: [
      createElement('span', {
        className: 'cypher-hatch',
        attributes: { 'aria-hidden': 'true' },
      }),
      'Unverified draft',
    ],
  });
}

export function formatReferenceCount(count: number): string {
  return count === 1 ? '1 reference' : `${count} references`;
}
