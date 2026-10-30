<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  hint?: string;
  errors?: ReadonlyArray<string>;
}>();
</script>

<template>
  <div class="field" :class="{ 'has-error': errors?.length }">
    <label class="field-label" :for="id">{{ label }}</label>
    <p v-if="hint" :id="`${id}-hint`" class="field-hint">{{ hint }}</p>
    <slot />
    <ul v-if="errors?.length" :id="`${id}-errors`" class="field-errors">
      <li v-for="message in errors" :key="message">{{ message }}</li>
    </ul>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: var(--space-1);
}

.field-label {
  font-weight: 700;
}

.field-hint {
  color: var(--muted);
  font-size: 0.875rem;
}

.field :slotted(input),
.field :slotted(select),
.field :slotted(textarea) {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--surface);
}

.field :slotted(textarea) {
  font-family: var(--font-reading);
  line-height: 1.55;
  resize: vertical;
}

.has-error :slotted(input),
.has-error :slotted(select),
.has-error :slotted(textarea) {
  border-color: var(--danger);
}

.field-errors {
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--danger);
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
