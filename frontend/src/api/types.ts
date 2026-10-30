export const TERM_TYPES = [
  'slang',
  'person',
  'place',
  'event',
  'brand',
  'religion',
  'other',
] as const;
export type TermType = (typeof TERM_TYPES)[number];

export const STATUSES = ['draft', 'verified'] as const;
export type Status = (typeof STATUSES)[number];

type Stored = {
  readonly id: number;
  readonly created_at: string;
  readonly updated_at: string;
};

export type AlbumPayload = {
  readonly title: string;
  readonly release_year: number;
  readonly artist: number;
  readonly overview: string;
  readonly overview_status: Status;
};
export type Album = Stored & AlbumPayload & { readonly artist_name: string };

export type TrackPayload = {
  readonly title: string;
  readonly album: number;
  readonly track_number: number;
  readonly duration_seconds: number;
};
export type Track = Stored & TrackPayload & { readonly album_title: string };

export type TermPayload = {
  readonly name: string;
  readonly type: TermType;
  readonly explanation: string;
  readonly explanation_ru: string;
  readonly sources: string;
  readonly status: Status;
  readonly notes: string;
};
export type Term = Stored & TermPayload;

export type ReferencePayload = {
  readonly track: number;
  readonly term: number;
  readonly timestamp_seconds: number;
  readonly context_note: string;
};
export type Reference = Stored &
  ReferencePayload & {
    readonly track_title: string;
    readonly term_name: string;
    readonly term_type: TermType;
    readonly timestamp: string;
  };

export type AlbumFilter = { readonly artist?: number };
export type TrackFilter = { readonly album?: number };
export type TermFilter = { readonly type?: TermType; readonly status?: Status };
export type ReferenceFilter = {
  readonly track?: number;
  readonly term?: number;
};
