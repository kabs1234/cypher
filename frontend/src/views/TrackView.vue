<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { getErrorMessage } from '@/api/client';
import { references, terms, tracks } from '@/api/resources';
import type { Reference, Term } from '@/api/types';
import LoadState from '@/components/LoadState.vue';
import ReferenceForm from '@/components/ReferenceForm.vue';
import TermDetail from '@/components/TermDetail.vue';
import TrackTimeline from '@/components/TrackTimeline.vue';
import TypeTag from '@/components/TypeTag.vue';
import { useAsync } from '@/composables/useAsync';
import { formatDuration, formatReferenceCount } from '@/format';

const props = defineProps<{ id: number }>();

const route = useRoute();
const router = useRouter();
const isAdding = ref(false);
const deleteError = ref<string>();

const page = useAsync(async () => {
  const [track, trackReferences, allTerms] = await Promise.all([
    tracks.get(props.id),
    references.list({ track: props.id }),
    terms.list(),
  ]);
  const albumTracks = await tracks.list({ album: track.album });
  return {
    track,
    albumTracks,
    allTerms,
    trackReferences: sortByTime(trackReferences),
  };
});

const orderedReferences = computed(
  () => page.data.value?.trackReferences ?? [],
);

const selectedReference = computed(() =>
  findSelectedReference(orderedReferences.value, {
    seconds: readNumberQuery('at'),
    referenceId: readNumberQuery('ref'),
  }),
);

const selectedTerm = computed(() =>
  page.data.value?.allTerms.find(
    (term) => term.id === selectedReference.value?.term,
  ),
);

const draftTermCount = computed(() =>
  countDraftTerms(orderedReferences.value, page.data.value?.allTerms ?? []),
);

const longestWordLength = computed(() =>
  Math.max(
    1,
    ...(page.data.value?.track.title ?? '')
      .split(/\s+/)
      .map((word) => word.length),
  ),
);

const neighbours = computed(() => {
  const albumTracks = page.data.value?.albumTracks ?? [];
  const index = albumTracks.findIndex((track) => track.id === props.id);
  return { previous: albumTracks[index - 1], next: albumTracks[index + 1] };
});

function selectMoment(seconds: number): void {
  void router.replace({ query: { at: seconds } });
}

function selectReference(reference: Reference): void {
  void router.replace({
    query: { at: reference.timestamp_seconds, ref: reference.id },
  });
}

async function handleSaved(reference: Reference): Promise<void> {
  isAdding.value = false;
  await page.reload();
  selectReference(reference);
}

async function deleteReference(reference: Reference): Promise<void> {
  if (
    !window.confirm(
      `Delete the reference to ${reference.term_name} at ${reference.timestamp}?`,
    )
  ) {
    return;
  }
  deleteError.value = undefined;
  try {
    await references.remove(reference.id);
    await router.replace({ query: {} });
    await page.reload();
  } catch (failure: unknown) {
    deleteError.value = getErrorMessage(failure);
  }
}

function readNumberQuery(key: string): number | undefined {
  const value = route.query[key];
  return typeof value === 'string' && value !== '' ? Number(value) : undefined;
}

function sortByTime(list: ReadonlyArray<Reference>): ReadonlyArray<Reference> {
  return [...list].sort(
    (first, second) => first.timestamp_seconds - second.timestamp_seconds,
  );
}

function findSelectedReference(
  list: ReadonlyArray<Reference>,
  selection: { readonly seconds?: number; readonly referenceId?: number },
): Reference | undefined {
  const byId = list.find((reference) => reference.id === selection.referenceId);
  const bySeconds = list.find(
    (reference) => reference.timestamp_seconds === selection.seconds,
  );
  return byId ?? bySeconds ?? list[0];
}

function countDraftTerms(
  list: ReadonlyArray<Reference>,
  allTerms: ReadonlyArray<Term>,
): number {
  const termIds = new Set(list.map((reference) => reference.term));
  return allTerms.filter(
    (term) => termIds.has(term.id) && term.status === 'draft',
  ).length;
}

function isSameMoment(reference: Reference): boolean {
  return (
    reference.timestamp_seconds === selectedReference.value?.timestamp_seconds
  );
}
</script>

<template>
  <LoadState
    :is-loading="page.isLoading.value"
    :error="page.error.value"
    @retry="page.reload"
  >
    <template v-if="page.data.value">
      <header class="track-header">
        <p class="track-byline">
          <RouterLink
            :to="{ name: 'album', params: { id: page.data.value.track.album } }"
          >
            {{ page.data.value.track.album_title }}
          </RouterLink>
          <span aria-hidden="true"> / </span>
          Track {{ page.data.value.track.track_number }} of
          {{ page.data.value.albumTracks.length }}
        </p>
        <h1
          class="track-title"
          :style="{ '--longest-word': longestWordLength }"
        >
          {{ page.data.value.track.title }}
        </h1>
        <p class="track-facts">
          {{ formatDuration(page.data.value.track.duration_seconds) }} long,
          {{ formatReferenceCount(orderedReferences.length).toLowerCase() }}
        </p>
      </header>

      <p class="caution" role="note">
        <span class="caution-stripe" aria-hidden="true"></span>
        <span>
          Timestamps are approximate.
          <template v-if="draftTermCount">
            {{ draftTermCount }} of the terms on this track are unverified
            drafts.
          </template>
        </span>
      </p>

      <section class="timeline-section" aria-label="Timeline">
        <TrackTimeline
          v-if="orderedReferences.length"
          :duration-seconds="page.data.value.track.duration_seconds"
          :references="orderedReferences"
          :selected-seconds="selectedReference?.timestamp_seconds"
          @select="selectMoment"
        />
        <p v-else class="empty">
          Nothing on this track is explained yet. Add the first reference below.
        </p>
      </section>

      <div class="track-layout">
        <section class="moments" aria-labelledby="moments-title">
          <div class="moments-head">
            <h2 id="moments-title" class="section-title">References</h2>
            <button
              v-if="!isAdding"
              type="button"
              class="button button-quiet"
              @click="isAdding = true"
            >
              Add reference
            </button>
          </div>

          <ReferenceForm
            v-if="isAdding"
            :track="page.data.value.track"
            :terms="page.data.value.allTerms"
            @saved="handleSaved"
            @cancel="isAdding = false"
          />

          <ol class="moment-list">
            <li v-for="reference in orderedReferences" :key="reference.id">
              <button
                type="button"
                class="moment-row"
                :class="{ 'is-same-moment': isSameMoment(reference) }"
                :aria-pressed="reference.id === selectedReference?.id"
                @click="selectReference(reference)"
              >
                <span class="moment-row-time">{{ reference.timestamp }}</span>
                <span class="moment-row-term">
                  {{ reference.term_name }}
                  <TypeTag :type="reference.term_type" />
                </span>
                <span class="moment-row-note">{{
                  reference.context_note
                }}</span>
              </button>
            </li>
          </ol>
        </section>

        <aside
          v-if="selectedReference && selectedTerm"
          class="panel"
          aria-label="Selected reference"
        >
          <div class="panel-moment">
            <p class="panel-time">At {{ selectedReference.timestamp }}</p>
            <p class="panel-note">{{ selectedReference.context_note }}</p>
          </div>
          <TermDetail :key="selectedTerm.id" :term="selectedTerm" />
          <div class="panel-actions">
            <RouterLink
              :to="{ name: 'term-edit', params: { id: selectedTerm.id } }"
              class="button button-quiet"
            >
              Edit term
            </RouterLink>
            <button
              type="button"
              class="button button-danger"
              @click="deleteReference(selectedReference)"
            >
              Delete reference
            </button>
          </div>
          <p v-if="deleteError" class="panel-error" role="alert">
            {{ deleteError }}
          </p>
        </aside>
      </div>

      <nav class="track-nav" aria-label="Other tracks">
        <RouterLink
          v-if="neighbours.previous"
          :to="{ name: 'track', params: { id: neighbours.previous.id } }"
          class="track-nav-link"
        >
          <span class="track-nav-label">Previous track</span>
          {{ neighbours.previous.title }}
        </RouterLink>
        <RouterLink
          v-if="neighbours.next"
          :to="{ name: 'track', params: { id: neighbours.next.id } }"
          class="track-nav-link track-nav-next"
        >
          <span class="track-nav-label">Next track</span>
          {{ neighbours.next.title }}
        </RouterLink>
      </nav>
    </template>
  </LoadState>
</template>

<style scoped>
.track-header {
  display: grid;
  gap: var(--space-2);
}

.track-byline,
.track-facts {
  font-size: 1.125rem;
  color: var(--muted);
}

.track-header {
  container-type: inline-size;
}

.track-title {
  font-size: clamp(2rem, calc(100cqi / (var(--longest-word) * 0.9)), 9rem);
  font-weight: 800;
  font-stretch: 125%;
  line-height: 0.85;
  letter-spacing: -0.035em;
  overflow-wrap: break-word;
}

.caution {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) 0 var(--space-4);
  font-weight: 600;
}

.caution-stripe {
  flex: none;
  width: 2.5rem;
  height: 1rem;
  border-radius: 3px;
  background: var(--hatch);
}

.timeline-section {
  padding-bottom: var(--space-4);
}

.track-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: var(--space-7);
  align-items: start;
  padding-top: var(--space-5);
  border-top: 3px solid var(--ink);
}

.moments {
  display: grid;
  gap: var(--space-4);
}

.moments-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
}

.moment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.moment-row {
  display: grid;
  grid-template-columns: 3.25rem 1fr;
  column-gap: var(--space-3);
  row-gap: var(--space-1);
  width: 100%;
  padding: var(--space-3) var(--space-2);
  border: 0;
  border-left: 4px solid transparent;
  border-bottom: 1px solid var(--rule);
  background: none;
  text-align: left;
  cursor: pointer;
}

.moment-row:hover {
  background: var(--surface);
}

.moment-row.is-same-moment {
  border-left-color: var(--draft);
}

.moment-row[aria-pressed='true'] {
  background: var(--surface);
  border-left-color: var(--ink);
}

.moment-row-time {
  grid-row: span 2;
  font-weight: 800;
  font-size: 1.125rem;
}

.moment-row-term {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-3);
  font-weight: 700;
}

.moment-row-note {
  grid-column: 2;
  font-family: var(--font-reading);
  color: var(--muted);
}

.panel {
  position: sticky;
  top: var(--space-4);
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
  border: 2px solid var(--ink);
  border-radius: 10px;
  background: var(--surface);
}

.panel-moment {
  display: grid;
  gap: var(--space-1);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--rule);
}

.panel-time {
  font-weight: 800;
  font-size: 1.125rem;
}

.panel-note {
  font-family: var(--font-reading);
  font-size: 1.0625rem;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.panel-error {
  color: var(--danger);
  font-weight: 600;
}

.track-nav {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-7);
  padding-top: var(--space-4);
  border-top: 1px solid var(--rule);
}

.track-nav-link {
  display: grid;
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
}

.track-nav-link:hover {
  text-decoration: underline;
}

.track-nav-next {
  margin-left: auto;
  text-align: right;
}

.track-nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted);
}

.empty {
  color: var(--muted);
}

@media (max-width: 56rem) {
  .track-layout {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .panel {
    position: static;
    grid-row: 1;
  }
}
</style>
