<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <section class="not-found">
    <h1 class="not-found-title">Nothing at this address.</h1>
    <p>
      The link may be old, or the item was deleted.
      <RouterLink to="/">Go to albums</RouterLink>.
    </p>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  gap: var(--space-4);
}

.not-found-title {
  font-size: clamp(2.25rem, 6vw, 4rem);
  font-weight: 800;
  font-stretch: 118%;
}
</style>
