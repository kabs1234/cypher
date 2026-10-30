import type {
  Album,
  Reference,
  Term,
  Track,
} from '../../frontend/src/api/types';

const API_BASE = 'http://localhost:8080/api';

export function listAlbums(): Promise<ReadonlyArray<Album>> {
  return getJson('/albums/');
}

export function listAlbumTracks(
  albumId: number,
): Promise<ReadonlyArray<Track>> {
  return getJson(`/tracks/?album=${albumId}`);
}

export function listTrackReferences(
  trackId: number,
): Promise<ReadonlyArray<Reference>> {
  return getJson(`/references/?track=${trackId}`);
}

export function listTerms(): Promise<ReadonlyArray<Term>> {
  return getJson('/terms/');
}

async function getJson<TResult>(path: string): Promise<TResult> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Cypher API answered ${response.status} for ${path}`);
  }
  return response.json();
}
