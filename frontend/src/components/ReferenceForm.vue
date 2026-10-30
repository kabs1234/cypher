<script setup lang="ts">
import { reactive, ref } from 'vue';

import {
  getErrorMessage,
  getFieldErrors,
  type FieldErrors,
} from '@/api/client';
import { references } from '@/api/resources';
import type { Reference, Term, Track } from '@/api/types';
import FormField from '@/components/FormField.vue';
import { formatDuration, parseOptionalNumber } from '@/format';

const CONTEXT_NOTE_MAX_LENGTH = 300;

const props = defineProps<{ track: Track; terms: ReadonlyArray<Term> }>();
const emit = defineEmits<{ saved: [reference: Reference]; cancel: [] }>();

const form = reactive<{
  term: string;
  timestampSeconds: string | number;
  contextNote: string;
}>({
  term: '',
  timestampSeconds: '',
  contextNote: '',
});
const errors = ref<FieldErrors>({});
const formError = ref<string>();
const isSaving = ref(false);

async function save(): Promise<void> {
  isSaving.value = true;
  errors.value = {};
  formError.value = undefined;
  try {
    const reference = await references.create({
      track: props.track.id,
      term: parseOptionalNumber(form.term),
      timestamp_seconds: parseOptionalNumber(form.timestampSeconds),
      context_note: form.contextNote,
    });
    emit('saved', reference);
  } catch (failure: unknown) {
    errors.value = getFieldErrors(failure);
    formError.value = Object.keys(errors.value).length
      ? undefined
      : getErrorMessage(failure);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <form class="reference-form" novalidate @submit.prevent="save">
    <h3 class="reference-form-title">New reference on {{ track.title }}</h3>

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

    <FormField id="reference-term" label="Term" :errors="errors.term">
      <select id="reference-term" v-model="form.term">
        <option value="" disabled>Choose a term</option>
        <option v-for="term in terms" :key="term.id" :value="String(term.id)">
          {{ term.name }}
        </option>
      </select>
    </FormField>

    <FormField
      id="reference-timestamp"
      label="Timestamp in seconds"
      :hint="`Between 0 and ${track.duration_seconds} (${formatDuration(track.duration_seconds)}).`"
      :errors="errors.timestamp_seconds"
    >
      <input
        id="reference-timestamp"
        v-model="form.timestampSeconds"
        type="number"
        inputmode="numeric"
      />
    </FormField>

    <FormField
      id="reference-note"
      label="Context note"
      hint="Say what happens at this moment in your own words. Don't quote lyrics."
      :errors="errors.context_note"
    >
      <textarea
        id="reference-note"
        v-model="form.contextNote"
        rows="3"
        :maxlength="CONTEXT_NOTE_MAX_LENGTH"
      ></textarea>
    </FormField>

    <div class="reference-form-actions">
      <button type="submit" class="button" :disabled="isSaving">
        Save reference
      </button>
      <button type="button" class="button button-quiet" @click="emit('cancel')">
        Cancel
      </button>
    </div>
  </form>
</template>

<style scoped>
.reference-form {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 2px dashed var(--ink);
  border-radius: 10px;
}

.reference-form-title {
  font-size: 1.125rem;
  font-weight: 800;
}

.reference-form-actions {
  display: flex;
  gap: var(--space-3);
}
</style>
