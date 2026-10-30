<script setup lang="ts">
import type { TermType } from '@/api/types';
import { TERM_TYPE_LABELS } from '@/format';

defineProps<{ type: TermType }>();
</script>

<template>
  <span class="type-tag" :style="{ '--tag-color': `var(--type-${type})` }">
    {{ TERM_TYPE_LABELS[type] }}
  </span>
</template>

<style scoped>
.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--tag-color);
  white-space: nowrap;
}

.type-tag::before {
  content: '';
  width: 0.7rem;
  height: 0.7rem;
  background: var(--tag-color);
}
</style>
