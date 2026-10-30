<script setup lang="ts">
import { computed, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { terms } from '@/api/resources';
import { STATUSES, TERM_TYPES, type Status, type TermType } from '@/api/types';
import LoadState from '@/components/LoadState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import TypeTag from '@/components/TypeTag.vue';
import { useAsync } from '@/composables/useAsync';
import { TERM_TYPE_LABELS } from '@/format';

const ALL = '';

const STATUS_FILTER_LABELS: Readonly<Record<Status, string>> = {
  draft: 'Unverified drafts',
  verified: 'Verified',
};

const route = useRoute();
const router = useRouter();

const typeFilter = computed<TermType | typeof ALL>({
  get: () => readChoice(route.query.type, TERM_TYPES) ?? ALL,
  set: (type) => updateQuery({ type }),
});

const statusFilter = computed<Status | typeof ALL>({
  get: () => readChoice(route.query.status, STATUSES) ?? ALL,
  set: (status) => updateQuery({ status }),
});

const { data, error, isLoading, reload } = useAsync(() =>
  terms.list({
    type: typeFilter.value || undefined,
    status: statusFilter.value || undefined,
  }),
);

watch([typeFilter, statusFilter], reload);

function updateQuery(change: Readonly<Record<string, string>>): void {
  const query = { ...route.query, ...change };
  const cleaned = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ALL),
  );
  void router.replace({ query: cleaned });
}

function readChoice<TChoice extends string>(
  value: unknown,
  choices: ReadonlyArray<TChoice>,
): TChoice | undefined {
  return choices.find((choice) => choice === value);
}
</script>

<template>
  <header class="terms-header">
    <h1 class="terms-title">Terms</h1>
    <RouterLink :to="{ name: 'term-new' }" class="button">Add term</RouterLink>
  </header>

  <div class="filters">
    <fieldset class="filter">
      <legend class="filter-legend">Type</legend>
      <label class="chip">
        <input v-model="typeFilter" type="radio" name="type" :value="ALL" />
        All types
      </label>
      <label
        v-for="type in TERM_TYPES"
        :key="type"
        class="chip"
        :style="{ '--chip-color': `var(--type-${type})` }"
      >
        <input v-model="typeFilter" type="radio" name="type" :value="type" />
        {{ TERM_TYPE_LABELS[type] }}
      </label>
    </fieldset>

    <fieldset class="filter">
      <legend class="filter-legend">Status</legend>
      <label class="chip">
        <input v-model="statusFilter" type="radio" name="status" :value="ALL" />
        Any status
      </label>
      <label v-for="status in STATUSES" :key="status" class="chip">
        <input
          v-model="statusFilter"
          type="radio"
          name="status"
          :value="status"
        />
        {{ STATUS_FILTER_LABELS[status] }}
      </label>
    </fieldset>
  </div>

  <LoadState :is-loading="isLoading && !data" :error="error" @retry="reload">
    <p class="result-count" role="status">
      {{ data?.length ?? 0 }} {{ data?.length === 1 ? 'term' : 'terms' }}
    </p>
    <p v-if="!data?.length" class="empty">
      No terms match these filters. Choose another type or status.
    </p>
    <ul v-else class="term-list" :class="{ 'is-refreshing': isLoading }">
      <li v-for="term in data" :key="term.id" class="term-row">
        <div class="term-row-head">
          <RouterLink
            :to="{ name: 'term', params: { id: term.id } }"
            class="term-row-name"
          >
            {{ term.name }}
          </RouterLink>
          <TypeTag :type="term.type" />
          <StatusBadge :status="term.status" />
        </div>
        <p class="term-row-explanation">{{ term.explanation }}</p>
      </li>
    </ul>
  </LoadState>
</template>

<style scoped>
.terms-header {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
}

.terms-title {
  font-size: clamp(3rem, 10vw, 7rem);
  font-weight: 800;
  font-stretch: 125%;
  line-height: 0.85;
  letter-spacing: -0.03em;
}

.filters {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--rule);
}

.filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.filter-legend {
  float: left;
  width: 4.5rem;
  font-weight: 700;
}

.chip {
  --chip-color: var(--ink);
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  border: 2px solid var(--chip-color);
  border-radius: 999px;
  color: var(--chip-color);
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
}

.chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.chip:has(input:checked) {
  background: var(--chip-color);
  color: var(--paper);
}

.chip:has(input:focus-visible) {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.result-count {
  padding: var(--space-4) 0 var(--space-2);
  color: var(--muted);
}

.term-list {
  margin: 0;
  padding: 0;
  list-style: none;
  columns: 2 26rem;
  column-gap: var(--space-7);
  transition: opacity 0.15s;
}

.term-list.is-refreshing {
  opacity: 0.5;
}

.term-row {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--rule);
  break-inside: avoid;
}

.term-row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
}

.term-row-name {
  font-size: 1.375rem;
  font-weight: 800;
  text-decoration: none;
}

.term-row-name:hover {
  text-decoration: underline;
}

.term-row-explanation {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  font-family: var(--font-reading);
  color: var(--muted);
  max-width: var(--measure);
}

.empty {
  color: var(--muted);
}
</style>
