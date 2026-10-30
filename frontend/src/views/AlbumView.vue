<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { albums, references, tracks } from '@/api/resources';
import type { Reference } from '@/api/types';
import LoadState from '@/components/LoadState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useAsync } from '@/composables/useAsync';
import {
  formatDuration,
  formatReferenceCount,
  splitParagraphs,
} from '@/format';

type Paragraph = { readonly lead?: string; readonly body: string };

const LEAD_PATTERN = /^([A-Z][A-Za-z ]{2,24}):\s+(.*)$/s;

const props = defineProps<{ id: number }>();

const page = useAsync(async () => {
  const [album, albumTracks, allReferences] = await Promise.all([
    albums.get(props.id),
    tracks.list({ album: props.id }),
    references.list(),
  ]);
  return { album, albumTracks, allReferences };
});

const paragraphs = computed(() =>
  splitParagraphs(page.data.value?.album.overview ?? '').map(splitLead),
);

function splitLead(paragraph: string): Paragraph {
  const match = LEAD_PATTERN.exec(paragraph);
  return match ? { lead: match[1], body: match[2] ?? '' } : { body: paragraph };
}

function countReferences(
  allReferences: ReadonlyArray<Reference>,
  trackId: number,
): number {
  return allReferences.filter((reference) => reference.track === trackId)
    .length;
}
</script>

<template>
  <LoadState
    :is-loading="page.isLoading.value"
    :error="page.error.value"
    @retry="page.reload"
  >
    <template v-if="page.data.value">
      <header class="album-header">
        <p class="album-byline">
          <RouterLink to="/">Albums</RouterLink>
          <span aria-hidden="true"> / </span>
          {{ page.data.value.album.artist_name }},
          {{ page.data.value.album.release_year }}
        </p>
        <h1 class="album-title">{{ page.data.value.album.title }}</h1>
      </header>

      <div class="album-layout">
        <section class="briefing" aria-labelledby="briefing-title">
          <div class="briefing-head">
            <h2 id="briefing-title" class="section-title">Before you listen</h2>
            <StatusBadge :status="page.data.value.album.overview_status" />
          </div>
          <div v-if="paragraphs.length" class="reading">
            <p v-for="paragraph in paragraphs" :key="paragraph.body">
              <strong v-if="paragraph.lead" class="briefing-lead">
                {{ paragraph.lead }}:
              </strong>
              {{ paragraph.body }}
            </p>
          </div>
          <p v-else class="empty">This album has no briefing yet.</p>
        </section>

        <section class="tracklist" aria-labelledby="tracklist-title">
          <h2 id="tracklist-title" class="section-title">Tracks</h2>
          <ol class="tracks">
            <li v-for="track in page.data.value.albumTracks" :key="track.id">
              <RouterLink
                :to="{ name: 'track', params: { id: track.id } }"
                class="track-link"
              >
                <span class="track-number">{{ track.track_number }}</span>
                <span class="track-title">{{ track.title }}</span>
                <span class="track-duration">
                  {{ formatDuration(track.duration_seconds) }}
                </span>
                <span class="track-count">
                  {{
                    formatReferenceCount(
                      countReferences(page.data.value.allReferences, track.id),
                    )
                  }}
                </span>
              </RouterLink>
            </li>
          </ol>
        </section>
      </div>
    </template>
  </LoadState>
</template>

<style scoped>
.album-header {
  display: grid;
  gap: var(--space-2);
  padding-bottom: var(--space-6);
}

.album-byline {
  font-size: 1.125rem;
  color: var(--muted);
}

.album-title {
  font-size: clamp(3.5rem, 13vw, 10rem);
  font-weight: 800;
  font-stretch: 125%;
  line-height: 0.85;
  letter-spacing: -0.035em;
}

.album-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 26rem);
  gap: var(--space-7);
  align-items: start;
  border-top: 3px solid var(--ink);
  padding-top: var(--space-5);
}

.briefing,
.tracklist {
  display: grid;
  gap: var(--space-4);
}

.briefing-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
}

.briefing-lead {
  font-family: var(--font-display);
  font-weight: 700;
}

.tracks {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--rule);
}

.track-link {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  grid-template-areas:
    'number title duration'
    'number count count';
  column-gap: var(--space-3);
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--rule);
  text-decoration: none;
}

.track-link:hover {
  background: var(--surface);
}

.track-number {
  grid-area: number;
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--muted);
}

.track-title {
  grid-area: title;
  font-weight: 700;
  font-size: 1.125rem;
}

.track-duration {
  grid-area: duration;
  color: var(--muted);
}

.track-count {
  grid-area: count;
  font-size: 0.875rem;
  color: var(--muted);
}

.empty {
  color: var(--muted);
}

@media (max-width: 56rem) {
  .album-layout {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
}
</style>
