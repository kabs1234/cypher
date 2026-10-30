<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { getErrorMessage } from '@/api/client';
import { terms } from '@/api/resources';
import LoadState from '@/components/LoadState.vue';
import TermDetail from '@/components/TermDetail.vue';
import { useAsync } from '@/composables/useAsync';

const props = defineProps<{ id: number }>();

const router = useRouter();
const deleteError = ref<string>();
const { data, error, isLoading, reload } = useAsync(() => terms.get(props.id));

async function deleteTerm(name: string): Promise<void> {
  const message = `Delete ${name}? Every reference to it on every track is deleted too.`;
  if (!window.confirm(message)) {
    return;
  }
  deleteError.value = undefined;
  try {
    await terms.remove(props.id);
    await router.push({ name: 'terms' });
  } catch (failure: unknown) {
    deleteError.value = getErrorMessage(failure);
  }
}
</script>

<template>
  <p class="breadcrumb">
    <RouterLink :to="{ name: 'terms' }">Terms</RouterLink>
  </p>
  <LoadState :is-loading="isLoading" :error="error" @retry="reload">
    <div v-if="data" class="term-page">
      <TermDetail :term="data" heading-level="h1" />
      <div class="term-actions">
        <RouterLink
          :to="{ name: 'term-edit', params: { id: data.id } }"
          class="button"
        >
          Edit term
        </RouterLink>
        <button
          type="button"
          class="button button-danger"
          @click="deleteTerm(data.name)"
        >
          Delete term
        </button>
      </div>
      <p v-if="deleteError" class="delete-error" role="alert">
        {{ deleteError }}
      </p>
    </div>
  </LoadState>
</template>

<style scoped>
.breadcrumb {
  padding-bottom: var(--space-4);
  font-size: 1.125rem;
  color: var(--muted);
}

.term-page {
  display: grid;
  gap: var(--space-6);
  max-width: 48rem;
}

.term-page :deep(.term-name) {
  font-size: clamp(2.5rem, 7vw, 5rem);
  font-stretch: 125%;
  letter-spacing: -0.02em;
}

.term-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--rule);
}

.delete-error {
  color: var(--danger);
  font-weight: 600;
}
</style>
