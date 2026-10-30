<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import {
  getErrorMessage,
  getFieldErrors,
  type FieldErrors,
} from '@/api/client';
import { terms } from '@/api/resources';
import { STATUSES, TERM_TYPES, type TermPayload } from '@/api/types';
import FormField from '@/components/FormField.vue';
import LoadState from '@/components/LoadState.vue';
import { useAsync } from '@/composables/useAsync';
import { STATUS_LABELS, TERM_TYPE_LABELS } from '@/format';

const EMPTY_TERM: TermPayload = {
  name: '',
  type: 'other',
  explanation: '',
  explanation_ru: '',
  sources: '',
  status: 'draft',
  notes: '',
};

const props = defineProps<{ id?: number }>();

const router = useRouter();
const form = reactive<TermPayload>({ ...EMPTY_TERM });
const errors = ref<FieldErrors>({});
const formError = ref<string>();
const isSaving = ref(false);

const existing = useAsync(async () => {
  if (props.id === undefined) {
    return undefined;
  }
  const term = await terms.get(props.id);
  Object.assign(form, pickPayload(term));
  return term;
});

async function save(): Promise<void> {
  isSaving.value = true;
  errors.value = {};
  formError.value = undefined;
  try {
    const saved =
      props.id === undefined
        ? await terms.create(form)
        : await terms.update(props.id, form);
    await router.push({ name: 'term', params: { id: saved.id } });
  } catch (failure: unknown) {
    errors.value = getFieldErrors(failure);
    formError.value = Object.keys(errors.value).length
      ? undefined
      : getErrorMessage(failure);
  } finally {
    isSaving.value = false;
  }
}

function pickPayload(term: TermPayload): TermPayload {
  const { name, type, explanation, explanation_ru, sources, status, notes } =
    term;
  return { name, type, explanation, explanation_ru, sources, status, notes };
}
</script>

<template>
  <p class="breadcrumb">
    <RouterLink :to="{ name: 'terms' }">Terms</RouterLink>
  </p>
  <LoadState
    :is-loading="existing.isLoading.value"
    :error="existing.error.value"
    @retry="existing.reload"
  >
    <form class="term-form" novalidate @submit.prevent="save">
      <h1 class="term-form-title">
        {{
          existing.data.value ? `Edit ${existing.data.value.name}` : 'New term'
        }}
      </h1>

      <ul
        v-if="errors.non_field_errors || formError"
        class="form-errors"
        role="alert"
      >
        <li v-for="message in errors.non_field_errors" :key="message">
          {{ message }}
        </li>
        <li v-if="formError">{{ formError }}</li>
      </ul>

      <FormField id="term-name" label="Name" :errors="errors.name">
        <input
          id="term-name"
          v-model="form.name"
          type="text"
          autocomplete="off"
        />
      </FormField>

      <div class="term-form-row">
        <FormField id="term-type" label="Type" :errors="errors.type">
          <select id="term-type" v-model="form.type">
            <option v-for="type in TERM_TYPES" :key="type" :value="type">
              {{ TERM_TYPE_LABELS[type] }}
            </option>
          </select>
        </FormField>

        <FormField id="term-status" label="Status" :errors="errors.status">
          <select id="term-status" v-model="form.status">
            <option v-for="status in STATUSES" :key="status" :value="status">
              {{ STATUS_LABELS[status] }}
            </option>
          </select>
        </FormField>
      </div>

      <FormField
        id="term-explanation"
        label="Explanation"
        hint="Plain English for a listener who doesn't know the culture."
        :errors="errors.explanation"
      >
        <textarea
          id="term-explanation"
          v-model="form.explanation"
          rows="5"
        ></textarea>
      </FormField>

      <FormField
        id="term-explanation-ru"
        label="Explanation in Russian (optional)"
        :errors="errors.explanation_ru"
      >
        <textarea
          id="term-explanation-ru"
          v-model="form.explanation_ru"
          rows="4"
          lang="ru"
        ></textarea>
      </FormField>

      <FormField
        id="term-sources"
        label="Sources"
        hint="One URL per line."
        :errors="errors.sources"
      >
        <textarea id="term-sources" v-model="form.sources" rows="3"></textarea>
      </FormField>

      <FormField
        id="term-notes"
        label="Editor's notes (optional)"
        hint="For example: regional usage, or a meaning people disagree on."
        :errors="errors.notes"
      >
        <textarea id="term-notes" v-model="form.notes" rows="2"></textarea>
      </FormField>

      <div class="term-form-actions">
        <button type="submit" class="button" :disabled="isSaving">
          {{ id === undefined ? 'Create term' : 'Save changes' }}
        </button>
        <RouterLink
          :to="
            id === undefined
              ? { name: 'terms' }
              : { name: 'term', params: { id } }
          "
          class="button button-quiet"
        >
          Cancel
        </RouterLink>
      </div>
    </form>
  </LoadState>
</template>

<style scoped>
.breadcrumb {
  padding-bottom: var(--space-4);
  font-size: 1.125rem;
  color: var(--muted);
}

.term-form {
  display: grid;
  gap: var(--space-5);
  max-width: 44rem;
}

.term-form-title {
  font-size: clamp(2.25rem, 6vw, 4rem);
  font-weight: 800;
  font-stretch: 118%;
  letter-spacing: -0.02em;
}

.term-form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-4);
}

.term-form-actions {
  display: flex;
  gap: var(--space-3);
}
</style>
