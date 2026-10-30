<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { albums } from '@/api/resources';
import LoadState from '@/components/LoadState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useAsync } from '@/composables/useAsync';

const { data, error, isLoading, reload } = useAsync(() => albums.list());
</script>

<template>
  <section class="intro">
    <h1 class="intro-title">Hear what the track is talking about.</h1>
    <p class="intro-text reading">
      Hip-hop is full of people, places, events, brands and faith that a
      listener from elsewhere may not know. Pick an album, read the briefing,
      then follow each track moment by moment.
    </p>
  </section>

  <LoadState :is-loading="isLoading" :error="error" @retry="reload">
    <p v-if="!data?.length" class="empty">
      No albums yet. Add one through the API at /api/albums/.
    </p>
    <ul v-else class="album-list" aria-label="Albums">
      <li v-for="album in data" :key="album.id" class="album-row">
        <RouterLink
          :to="{ name: 'album', params: { id: album.id } }"
          class="album-link"
        >
          <span class="album-title">{{ album.title }}</span>
          <span class="album-byline">
            {{ album.artist_name }}, {{ album.release_year }}
          </span>
        </RouterLink>
        <p class="album-status">
          Briefing
          <StatusBadge :status="album.overview_status" />
        </p>
      </li>
    </ul>
  </LoadState>
</template>

<style scoped>
.intro {
  display: grid;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
}

.intro-title {
  max-width: 16ch;
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  font-weight: 800;
  font-stretch: 112%;
}

.album-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 3px solid var(--ink);
}

.album-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--rule);
}

.album-link {
  display: grid;
  gap: var(--space-1);
  text-decoration: none;
}

.album-title {
  font-size: clamp(3rem, 11vw, 7.5rem);
  font-weight: 800;
  font-stretch: 125%;
  line-height: 0.9;
  letter-spacing: -0.03em;
}

.album-link:hover .album-title {
  text-decoration: underline;
  text-decoration-color: var(--draft);
  text-decoration-thickness: 0.08em;
}

.album-byline {
  font-size: 1.125rem;
  color: var(--muted);
}

.album-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--muted);
}

.empty {
  color: var(--muted);
}
</style>
