<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { references } from '@/api/resources';
import type { Term } from '@/api/types';
import StatusBadge from '@/components/StatusBadge.vue';
import TypeTag from '@/components/TypeTag.vue';
import { useAsync } from '@/composables/useAsync';
import { formatSourceLabel, splitSources } from '@/format';

const props = defineProps<{
  term: Term;
  headingLevel?: 'h1' | 'h2' | 'h3';
}>();

const appearances = useAsync(() => references.list({ term: props.term.id }));
const sources = computed(() => splitSources(props.term.sources));
</script>

<template>
  <article class="term">
    <header class="term-header">
      <component :is="headingLevel ?? 'h2'" class="term-name">
        {{ term.name }}
      </component>
      <div class="term-meta">
        <TypeTag :type="term.type" />
        <StatusBadge :status="term.status" />
      </div>
    </header>

    <div class="reading">
      <p>{{ term.explanation }}</p>
    </div>

    <details v-if="term.explanation_ru" class="term-ru">
      <summary>Read in Russian</summary>
      <p class="reading" lang="ru">{{ term.explanation_ru }}</p>
    </details>

    <section v-if="term.notes" class="term-section">
      <h3 class="term-section-title">Editor's notes</h3>
      <p class="term-notes">{{ term.notes }}</p>
    </section>

    <section class="term-section">
      <h3 class="term-section-title">Sources</h3>
      <ul class="term-sources">
        <li v-for="source in sources" :key="source">
          <a :href="source" target="_blank" rel="noopener noreferrer">
            {{ formatSourceLabel(source) }}
          </a>
        </li>
      </ul>
    </section>

    <section v-if="appearances.data.value?.length" class="term-section">
      <h3 class="term-section-title">Where it comes up</h3>
      <ul class="term-appearances">
        <li v-for="reference in appearances.data.value" :key="reference.id">
          <RouterLink
            :to="{
              name: 'track',
              params: { id: reference.track },
              query: { at: reference.timestamp_seconds },
            }"
          >
            {{ reference.track_title }} at {{ reference.timestamp }}
          </RouterLink>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.term {
  display: grid;
  gap: var(--space-4);
}

.term-header {
  display: grid;
  gap: var(--space-2);
}

.term-name {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 800;
  font-stretch: 112%;
}

.term-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.term-ru summary {
  cursor: pointer;
  font-weight: 600;
}

.term-ru p {
  margin-top: var(--space-2);
}

.term-section {
  display: grid;
  gap: var(--space-1);
}

.term-section-title {
  font-size: 1rem;
  font-weight: 700;
}

.term-notes {
  max-width: var(--measure);
  font-family: var(--font-reading);
  font-style: italic;
}

.term-sources,
.term-appearances {
  margin: 0;
  padding-left: 1.1rem;
}

.term-sources a {
  overflow-wrap: anywhere;
}
</style>
