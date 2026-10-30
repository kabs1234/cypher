const STYLE_ELEMENT_ID = 'cypher-styles';

const CSS = `
:root {
  --cypher-draft: #f2b705;
  --cypher-ink: #16181b;
  --cypher-hatch: repeating-linear-gradient(-45deg, var(--cypher-draft) 0 5px, var(--cypher-ink) 5px 8px);
  --cypher-type-slang: #c38df0;
  --cypher-type-person: #6fa8f5;
  --cypher-type-place: #5ccf8f;
  --cypher-type-event: #f2786b;
  --cypher-type-brand: #3ccfc4;
  --cypher-type-religion: #e3b75a;
  --cypher-type-other: #a7adb6;
}

.cypher-card {
  position: fixed;
  right: 16px;
  bottom: 104px;
  z-index: 100;
  display: grid;
  gap: 10px;
  width: 340px;
  padding: 18px 16px 16px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--spice-card, #282828);
  color: var(--spice-text, #fff);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cypher-card.is-draft::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 6px;
  background: var(--cypher-hatch);
}

.cypher-card.is-visible {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.cypher-card-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cypher-wordmark {
  font-weight: 800;
  letter-spacing: -0.01em;
}

.cypher-card-time {
  color: var(--spice-subtext, #b3b3b3);
  font-variant-numeric: tabular-nums;
}

.cypher-card-close {
  margin-left: auto;
  border: 0;
  background: none;
  color: var(--spice-subtext, #b3b3b3);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.cypher-card-close:hover {
  color: var(--spice-text, #fff);
}

.cypher-card-terms {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cypher-card-terms li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
}

.cypher-card-term {
  font-size: 16px;
  font-weight: 700;
}

.cypher-card-note {
  margin: 0;
  color: var(--spice-subtext, #b3b3b3);
  font-size: 14px;
  line-height: 1.45;
}

.cypher-card-open {
  justify-self: start;
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--spice-text, #fff);
  color: var(--spice-main, #121212);
  font-weight: 700;
  cursor: pointer;
}

.cypher-card-open:hover {
  transform: scale(1.03);
}

.cypher-type {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--cypher-type-color);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.cypher-type::before {
  content: '';
  width: 9px;
  height: 9px;
  background: var(--cypher-type-color);
}

.cypher-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 8px 1px 2px;
  border: 1.5px solid currentColor;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.cypher-status-verified {
  padding-left: 8px;
}

.cypher-hatch {
  display: inline-block;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--cypher-hatch);
  vertical-align: -2px;
}

.cypher-panel {
  display: grid;
  gap: 8px;
  line-height: 1.5;
}

.cypher-panel-intro {
  display: grid;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--spice-subtext, #b3b3b3);
}

.cypher-panel-intro p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.cypher-panel a {
  color: var(--spice-text, #fff);
  text-decoration: underline;
}

.cypher-moment {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  scroll-margin-top: 8px;
}

.cypher-moment-time {
  align-self: start;
  padding: 4px 0;
  border: 2px solid var(--spice-text, #fff);
  border-radius: 999px;
  background: none;
  color: var(--spice-text, #fff);
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.cypher-moment-time:hover {
  background: var(--spice-text, #fff);
  color: var(--spice-main, #121212);
}

.cypher-moment-body {
  display: grid;
  gap: 20px;
}

.cypher-reference {
  display: grid;
  gap: 6px;
}

.cypher-reference-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
}

.cypher-reference-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.cypher-reference-note {
  margin: 0;
  color: var(--spice-subtext, #b3b3b3);
  font-style: italic;
}

.cypher-term {
  display: grid;
  gap: 6px;
  max-width: 64ch;
}

.cypher-term p {
  margin: 0;
}

.cypher-term summary {
  cursor: pointer;
  font-weight: 700;
}

.cypher-term-notes {
  color: var(--spice-subtext, #b3b3b3);
}

.cypher-term-sources {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .cypher-card {
    transition: none;
  }
}
`;

export function injectStyles(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = CSS;
  document.head.append(style);
}
