import type { Reference, Term, Track } from '../../../frontend/src/api/types';
import { formatTimestamp, type Moment } from '../moments';
import { createElement } from './dom';
import {
  createStatusBadge,
  createTypeTag,
  formatReferenceCount,
} from './parts';

const WEBSITE_BASE = 'http://localhost:8080';

export type PanelOptions = {
  readonly track: Track;
  readonly moments: ReadonlyArray<Moment>;
  readonly termsById: ReadonlyMap<number, Term>;
  readonly focusSeconds?: number;
  readonly onSeek: (seconds: number) => void;
};

export function openReferencePanel(options: PanelOptions): void {
  const content = createElement('div', {
    className: 'cypher-panel',
    children: [
      buildIntro(options),
      ...options.moments.map((moment) => buildMoment(moment, options)),
    ],
  });
  Spicetify.PopupModal.display({
    title: `Cypher: ${options.track.title}`,
    content,
    isLarge: true,
  });
  scrollToMoment(content, options.focusSeconds);
}

function buildIntro(options: PanelOptions): HTMLElement {
  const referenceCount = options.moments.reduce(
    (total, moment) => total + moment.references.length,
    0,
  );
  return createElement('div', {
    className: 'cypher-panel-intro',
    children: [
      createElement('p', {
        children: [
          createElement('span', {
            className: 'cypher-hatch',
            attributes: { 'aria-hidden': 'true' },
          }),
          `${formatReferenceCount(referenceCount)}. Timestamps are approximate. Select a time to play from there.`,
        ],
      }),
      createElement('a', {
        text: 'Open this track on the Cypher website',
        attributes: {
          href: `${WEBSITE_BASE}/tracks/${options.track.id}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
  });
}

function buildMoment(moment: Moment, options: PanelOptions): HTMLElement {
  return createElement('section', {
    className: 'cypher-moment',
    attributes: { 'data-seconds': String(moment.seconds) },
    children: [
      createElement('button', {
        className: 'cypher-moment-time',
        text: formatTimestamp(moment.seconds),
        attributes: {
          type: 'button',
          'aria-label': `Play from ${formatTimestamp(moment.seconds)}`,
        },
        onClick: () => options.onSeek(moment.seconds),
      }),
      createElement('div', {
        className: 'cypher-moment-body',
        children: moment.references.map((reference) =>
          buildReference(reference, options.termsById.get(reference.term)),
        ),
      }),
    ],
  });
}

function buildReference(
  reference: Reference,
  term: Term | undefined,
): HTMLElement {
  return createElement('article', {
    className: 'cypher-reference',
    children: [
      createElement('header', {
        className: 'cypher-reference-head',
        children: [
          createElement('h3', { text: reference.term_name }),
          createTypeTag(reference.term_type),
          term && createStatusBadge(term.status),
        ],
      }),
      createElement('p', {
        className: 'cypher-reference-note',
        text: reference.context_note,
      }),
      term && buildTermDetail(term),
    ],
  });
}

function buildTermDetail(term: Term): HTMLElement {
  const sources = term.sources
    .split('\n')
    .map((source) => source.trim())
    .filter(Boolean);
  return createElement('div', {
    className: 'cypher-term',
    children: [
      createElement('p', { text: term.explanation }),
      term.explanation_ru &&
        createElement('details', {
          children: [
            createElement('summary', { text: 'Read in Russian' }),
            createElement('p', {
              text: term.explanation_ru,
              attributes: { lang: 'ru' },
            }),
          ],
        }),
      term.notes &&
        createElement('p', {
          className: 'cypher-term-notes',
          text: `Editor's note: ${term.notes}`,
        }),
      createElement('ul', {
        className: 'cypher-term-sources',
        children: sources.map((source) =>
          createElement('li', {
            children: [
              createElement('a', {
                text: formatSourceLabel(source),
                attributes: {
                  href: source,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
              }),
            ],
          }),
        ),
      }),
    ],
  });
}

function formatSourceLabel(source: string): string {
  try {
    const url = new URL(source);
    return decodeURIComponent(
      `${url.hostname.replace(/^www\./, '')}${url.pathname}`,
    );
  } catch {
    return source;
  }
}

function scrollToMoment(content: HTMLElement, seconds?: number): void {
  if (seconds === undefined) {
    return;
  }
  requestAnimationFrame(() =>
    content
      .querySelector(`[data-seconds="${seconds}"]`)
      ?.scrollIntoView({ block: 'start' }),
  );
}
