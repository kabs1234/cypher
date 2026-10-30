import type { Album, Track } from '../../frontend/src/api/types';
import { listAlbums, listAlbumTracks } from './api';

export type SpotifyTrackInfo = {
  readonly artistName: string;
  readonly albumTitle: string;
  readonly trackNumber: number;
};

export function readSpotifyTrackInfo(
  item: Spicetify.PlayerTrack | undefined,
): SpotifyTrackInfo | undefined {
  if (!item) {
    return undefined;
  }
  const { artist_name, album_title, album_track_number } = item.metadata;
  return {
    artistName: artist_name ?? '',
    albumTitle: album_title ?? '',
    trackNumber: Number(album_track_number),
  };
}

export async function findCypherTrack(
  info: SpotifyTrackInfo,
): Promise<Track | undefined> {
  const album = (await listAlbums()).find((candidate) =>
    isSameAlbum(candidate, info),
  );
  if (!album) {
    return undefined;
  }
  const albumTracks = await listAlbumTracks(album.id);
  return albumTracks.find((track) => track.track_number === info.trackNumber);
}

function isSameAlbum(album: Album, info: SpotifyTrackInfo): boolean {
  return (
    normalize(album.title) === normalize(info.albumTitle) &&
    normalize(album.artist_name) === normalize(info.artistName)
  );
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}
