<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead">
    <RouterLink to="/" class="wordmark">Cypher</RouterLink>
    <nav class="masthead-nav" aria-label="Main">
      <RouterLink to="/" class="masthead-link" exact-active-class="is-current"
        >Albums</RouterLink
      >
      <RouterLink to="/terms" class="masthead-link" active-class="is-current"
        >Terms</RouterLink
      >
    </nav>
  </header>
  <main id="main" class="page">
    <RouterView :key="$route.path" />
  </main>
  <footer class="colophon">
    <p>Cypher explains context by track and timestamp. It stores no lyrics.</p>
  </footer>
</template>

<style scoped>
.masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--page-inset);
  border-bottom: 3px solid var(--ink);
}

.wordmark {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 800;
  font-stretch: 125%;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
}

.masthead-nav {
  display: flex;
  gap: var(--space-4);
}

.masthead-link {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 3px solid transparent;
}

.masthead-link:hover,
.masthead-link.is-current {
  border-bottom-color: var(--draft);
}

.page {
  flex: 1;
  width: 100%;
  padding: var(--space-6) var(--page-inset) var(--space-8);
}

.colophon {
  padding: var(--space-4) var(--page-inset);
  border-top: 1px solid var(--rule);
  color: var(--muted);
  font-size: 0.875rem;
}

.skip-link {
  position: absolute;
  left: var(--space-2);
  top: -3rem;
  padding: var(--space-2) var(--space-3);
  background: var(--ink);
  color: var(--paper);
}

.skip-link:focus {
  top: var(--space-2);
}
</style>
