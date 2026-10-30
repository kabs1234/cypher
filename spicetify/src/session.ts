import type { Term, Track } from '../../frontend/src/api/types';
import { listTerms, listTrackReferences } from './api';
import {
  findCypherTrack,
  readSpotifyTrackInfo,
  type SpotifyTrackInfo,
} from './matching';
import { findActiveMoment, groupByTimestamp, type Moment } from './moments';
import { createLiveCard, type LiveCard } from './ui/card';
import { openReferencePanel } from './ui/panel';
import { formatReferenceCount } from './ui/parts';

type TrackContext = {
  readonly track: Track;
  readonly moments: ReadonlyArray<Moment>;
  readonly termsById: ReadonlyMap<number, Term>;
};

const MILLISECONDS_PER_SECOND = 1000;
const IDLE_LABEL = 'Cypher: nothing explained for this track';
const UNREACHABLE_LABEL =
  'Cypher: the API at localhost:8080 is not reachable. Start it with docker compose up.';
const CYPHER_ICON = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="7" width="14" height="2"/><rect x="4" y="2" width="2" height="12"/><rect x="10" y="4" width="2" height="8"/></svg>`;

export class CypherSession {
  private context: TrackContext | undefined;
  private loadCount = 0;
  private activeSeconds: number | undefined;
  private dismissedSeconds: ReadonlySet<number> = new Set();
  private readonly button: Spicetify.Playbar.Button;
  private readonly card: LiveCard;

  constructor() {
    this.button = new Spicetify.Playbar.Button(
      IDLE_LABEL,
      CYPHER_ICON,
      () => this.openPanel(),
      true,
      false,
      true,
    );
    this.card = createLiveCard({
      onOpen: (seconds) => this.openPanel(seconds),
      onDismiss: (seconds) => this.dismiss(seconds),
    });
  }

  start(): void {
    Spicetify.Player.addEventListener('songchange', () => {
      void this.loadCurrentTrack();
    });
    Spicetify.Player.addEventListener('onprogress', (event) => {
      this.handleProgress(event?.data ?? Spicetify.Player.getProgress());
    });
    void this.loadCurrentTrack();
  }

  private async loadCurrentTrack(): Promise<void> {
    this.loadCount += 1;
    const loadId = this.loadCount;
    this.applyContext(undefined);
    const info = readSpotifyTrackInfo(Spicetify.Player.data?.item);
    if (!info) {
      return;
    }
    try {
      const context = await loadTrackContext(info);
      if (loadId === this.loadCount) {
        this.applyContext(context);
      }
    } catch {
      if (loadId === this.loadCount) {
        this.showUnreachable();
      }
    }
  }

  private applyContext(context: TrackContext | undefined): void {
    this.context = context;
    this.activeSeconds = undefined;
    this.dismissedSeconds = new Set();
    this.card.hide();
    const referenceCount =
      context?.moments.reduce(
        (total, moment) => total + moment.references.length,
        0,
      ) ?? 0;
    this.button.disabled = referenceCount === 0;
    this.button.active = referenceCount > 0;
    this.button.label =
      referenceCount > 0
        ? `Cypher: ${formatReferenceCount(referenceCount)} on this track`
        : IDLE_LABEL;
    this.handleProgress(Spicetify.Player.getProgress());
  }

  private showUnreachable(): void {
    this.button.disabled = true;
    this.button.active = false;
    this.button.label = UNREACHABLE_LABEL;
  }

  private handleProgress(progressMilliseconds: number): void {
    if (!this.context) {
      return;
    }
    const moment = findActiveMoment(
      this.context.moments,
      progressMilliseconds / MILLISECONDS_PER_SECOND,
    );
    if (moment?.seconds === this.activeSeconds) {
      return;
    }
    this.activeSeconds = moment?.seconds;
    if (!moment || this.dismissedSeconds.has(moment.seconds)) {
      this.card.hide();
      return;
    }
    this.card.show(moment, this.context.termsById);
  }

  private dismiss(seconds: number): void {
    this.dismissedSeconds = new Set([...this.dismissedSeconds, seconds]);
    this.card.hide();
  }

  private openPanel(focusSeconds?: number): void {
    if (!this.context) {
      return;
    }
    openReferencePanel({
      ...this.context,
      focusSeconds,
      onSeek: (seconds) => seekTo(seconds),
    });
  }
}

async function loadTrackContext(
  info: SpotifyTrackInfo,
): Promise<TrackContext | undefined> {
  const track = await findCypherTrack(info);
  if (!track) {
    return undefined;
  }
  const [references, terms] = await Promise.all([
    listTrackReferences(track.id),
    listTerms(),
  ]);
  return {
    track,
    moments: groupByTimestamp(references),
    termsById: new Map(terms.map((term) => [term.id, term])),
  };
}

function seekTo(seconds: number): void {
  Spicetify.Player.seek(seconds * MILLISECONDS_PER_SECOND);
  Spicetify.PopupModal.hide();
}
