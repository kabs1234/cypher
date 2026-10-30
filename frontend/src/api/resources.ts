import {
  buildQuery,
  requestEmpty,
  requestJson,
  type QueryParams,
} from './client';
import type {
  Album,
  AlbumFilter,
  AlbumPayload,
  Reference,
  ReferenceFilter,
  ReferencePayload,
  Term,
  TermFilter,
  TermPayload,
  Track,
  TrackFilter,
  TrackPayload,
} from './types';

export type Draft<TPayload> = {
  readonly [Key in keyof TPayload]: TPayload[Key] | null;
};

export type Resource<TItem, TPayload, TFilter extends QueryParams> = {
  readonly list: (filter?: TFilter) => Promise<ReadonlyArray<TItem>>;
  readonly get: (id: number) => Promise<TItem>;
  readonly create: (payload: Draft<TPayload>) => Promise<TItem>;
  readonly update: (id: number, payload: Draft<TPayload>) => Promise<TItem>;
  readonly remove: (id: number) => Promise<void>;
};

export const albums = createResource<Album, AlbumPayload, AlbumFilter>(
  'albums',
);
export const tracks = createResource<Track, TrackPayload, TrackFilter>(
  'tracks',
);
export const terms = createResource<Term, TermPayload, TermFilter>('terms');
export const references = createResource<
  Reference,
  ReferencePayload,
  ReferenceFilter
>('references');

function createResource<TItem, TPayload, TFilter extends QueryParams>(
  name: string,
): Resource<TItem, TPayload, TFilter> {
  const collection = `/${name}/`;
  const member = (id: number): string => `${collection}${id}/`;

  return {
    list: (filter) => requestJson(`${collection}${buildQuery(filter)}`),
    get: (id) => requestJson(member(id)),
    create: (payload) =>
      requestJson(collection, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id, payload) =>
      requestJson(member(id), { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => requestEmpty(member(id), { method: 'DELETE' }),
  };
}
