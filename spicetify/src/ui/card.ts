import type { Term } from '../../../frontend/src/api/types';
import { formatTimestamp, type Moment } from '../moments';
import { createElement } from './dom';
import { createTypeTag } from './parts';

export type LiveCardHandlers = {
  readonly onOpen: (seconds: number) => void;
  readonly onDismiss: (seconds: number) => void;
};

export type LiveCard = {
  readonly show: (moment: Moment, termsById: ReadonlyMap<number, Term>) => void;
  readonly hide: () => void;
};

export function createLiveCard(handlers: LiveCardHandlers): LiveCard {
  const root = createElement('aside', {
    className: 'cypher-card',
    attributes: { 'aria-live': 'polite', 'aria-label': 'Cypher' },
  });
  document.body.append(root);

  return {
    show: (moment, termsById) => {
      root.replaceChildren(
        ...buildCardContent(moment, { termsById, handlers }),
      );
      root.classList.toggle('is-draft', hasDraftTerm(moment, termsById));
      root.classList.add('is-visible');
    },
    hide: () => root.classList.remove('is-visible'),
  };
}

function buildCardContent(
  moment: Moment,
  context: {
    readonly termsById: ReadonlyMap<number, Term>;
    readonly handlers: LiveCardHandlers;
  },
): ReadonlyArray<HTMLElement> {
  const [first] = moment.references;
  return [
    createElement('header', {
      className: 'cypher-card-head',
      children: [
        createElement('span', { className: 'cypher-wordmark', text: 'Cypher' }),
        createElement('span', {
          className: 'cypher-card-time',
          text: `at ${formatTimestamp(moment.seconds)}`,
        }),
        createElement('button', {
          className: 'cypher-card-close',
          text: '×',
          attributes: { type: 'button', 'aria-label': 'Hide for this moment' },
          onClick: () => context.handlers.onDismiss(moment.seconds),
        }),
      ],
    }),
    createElement('ul', {
      className: 'cypher-card-terms',
      children: moment.references.map((reference) =>
        createElement('li', {
          children: [
            createElement('span', {
              className: 'cypher-card-term',
              text: reference.term_name,
            }),
            createTypeTag(reference.term_type),
          ],
        }),
      ),
    }),
    moment.references.length === 1 && first
      ? createElement('p', {
          className: 'cypher-card-note',
          text: first.context_note,
        })
      : createElement('p', {
          className: 'cypher-card-note',
          text: `${moment.references.length} things come up at this moment.`,
        }),
    createElement('button', {
      className: 'cypher-card-open',
      text: 'Read the explanation',
      attributes: { type: 'button' },
      onClick: () => context.handlers.onOpen(moment.seconds),
    }),
  ];
}

function hasDraftTerm(
  moment: Moment,
  termsById: ReadonlyMap<number, Term>,
): boolean {
  return moment.references.some(
    (reference) => termsById.get(reference.term)?.status === 'draft',
  );
}
