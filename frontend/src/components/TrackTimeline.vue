<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import type { Reference } from '@/api/types';
import { useElementWidth } from '@/composables/useElementWidth';
import { formatDuration, formatReferenceCount } from '@/format';

type Moment = {
  readonly seconds: number;
  readonly references: ReadonlyArray<Reference>;
};

type Span = { readonly start: number; readonly end: number };

type PlacedMoment = Moment & {
  readonly position: number;
  readonly lane: number;
  readonly isRightAnchored: boolean;
  readonly span: Span;
};

type Layout = {
  readonly durationSeconds: number;
  readonly widthPx: number;
  readonly labelWidthPx: number;
};

const NARROW_WIDTH_PX = 600;
const LABEL_WIDTH_PX = 215;
const NARROW_LABEL_WIDTH_PX = 100;
const LABEL_GAP_PX = 8;
const MAX_LANES = 6;
const SECONDS_PER_MINUTE = 60;
const LONG_TRACK_SECONDS = 300;
const MIN_SECONDS_BEFORE_END_TICK = 30;

const props = defineProps<{
  durationSeconds: number;
  references: ReadonlyArray<Reference>;
  selectedSeconds?: number;
}>();

defineEmits<{ select: [seconds: number] }>();

const timeline = useTemplateRef<HTMLElement>('timeline');
const widthPx = useElementWidth(timeline);
const isNarrow = computed(() => widthPx.value < NARROW_WIDTH_PX);

const placedMoments = computed(() =>
  placeInLanes(groupByTimestamp(props.references), {
    durationSeconds: props.durationSeconds,
    widthPx: widthPx.value,
    labelWidthPx: isNarrow.value ? NARROW_LABEL_WIDTH_PX : LABEL_WIDTH_PX,
  }),
);

const usedLaneCount = computed(
  () => Math.max(0, ...placedMoments.value.map((moment) => moment.lane)) + 1,
);

const ticks = computed(() => {
  const step =
    isNarrow.value && props.durationSeconds > LONG_TRACK_SECONDS
      ? 2 * SECONDS_PER_MINUTE
      : SECONDS_PER_MINUTE;
  return Array.from(
    { length: Math.floor(props.durationSeconds / step) + 1 },
    (_, index) => index * step,
  ).filter(
    (tick) => props.durationSeconds - tick >= MIN_SECONDS_BEFORE_END_TICK,
  );
});

function groupByTimestamp(
  references: ReadonlyArray<Reference>,
): ReadonlyArray<Moment> {
  const secondsList = [
    ...new Set(references.map((reference) => reference.timestamp_seconds)),
  ].sort((first, second) => first - second);
  return secondsList.map((seconds) => ({
    seconds,
    references: references.filter(
      (reference) => reference.timestamp_seconds === seconds,
    ),
  }));
}

function placeInLanes(
  moments: ReadonlyArray<Moment>,
  layout: Layout,
): ReadonlyArray<PlacedMoment> {
  return moments.reduce<ReadonlyArray<PlacedMoment>>((placed, moment) => {
    const position = toPercent(moment.seconds, layout.durationSeconds);
    const offsetPx = (position / 100) * layout.widthPx;
    const isRightAnchored = offsetPx + layout.labelWidthPx > layout.widthPx;
    const span = isRightAnchored
      ? { start: offsetPx - layout.labelWidthPx, end: offsetPx }
      : { start: offsetPx, end: offsetPx + layout.labelWidthPx };
    const lane = findFreeLane(placed, span);
    return [...placed, { ...moment, position, lane, isRightAnchored, span }];
  }, []);
}

function findFreeLane(placed: ReadonlyArray<PlacedMoment>, span: Span): number {
  const isLaneFree = (lane: number): boolean =>
    placed
      .filter((moment) => moment.lane === lane)
      .every((moment) => !doSpansOverlap(moment.span, span));
  const freeLane = Array.from({ length: MAX_LANES }, (_, lane) => lane).find(
    isLaneFree,
  );
  return freeLane ?? placed.length % MAX_LANES;
}

function doSpansOverlap(first: Span, second: Span): boolean {
  return (
    first.start < second.end + LABEL_GAP_PX &&
    second.start < first.end + LABEL_GAP_PX
  );
}

function toPercent(seconds: number, durationSeconds: number): number {
  return durationSeconds > 0 ? (seconds / durationSeconds) * 100 : 0;
}

function describeMoment(moment: Moment): string {
  const [first] = moment.references;
  if (moment.references.length === 1 && first) {
    return first.term_name;
  }
  return formatReferenceCount(moment.references.length);
}

function buildAccessibleLabel(moment: Moment): string {
  const names = moment.references
    .map((reference) => reference.term_name)
    .join(', ');
  return `${formatDuration(moment.seconds)}: ${names}`;
}
</script>

<template>
  <div
    ref="timeline"
    class="timeline"
    :style="{ '--lane-count': usedLaneCount }"
  >
    <ol class="timeline-ruler" aria-hidden="true">
      <li
        v-for="tick in ticks"
        :key="tick"
        class="timeline-tick"
        :style="{ left: `${toPercent(tick, durationSeconds)}%` }"
      >
        {{ formatDuration(tick) }}
      </li>
      <li class="timeline-tick timeline-tick-end">
        {{ formatDuration(durationSeconds) }}
      </li>
    </ol>
    <div class="timeline-bar" aria-hidden="true"></div>
    <ol class="timeline-moments" aria-label="References by timestamp">
      <li
        v-for="moment in placedMoments"
        :key="moment.seconds"
        class="timeline-moment"
        :class="{ 'is-right': moment.isRightAnchored }"
        :style="{ left: `${moment.position}%`, '--lane': moment.lane }"
      >
        <button
          type="button"
          class="moment-button"
          :aria-pressed="moment.seconds === selectedSeconds"
          :aria-label="buildAccessibleLabel(moment)"
          @click="$emit('select', moment.seconds)"
        >
          <span class="moment-head"></span>
          <span class="moment-stem"></span>
          <span class="moment-label">
            <span class="moment-time">{{
              formatDuration(moment.seconds)
            }}</span>
            <span class="moment-swatches">
              <span
                v-for="reference in moment.references"
                :key="reference.id"
                class="moment-swatch"
                :style="{ background: `var(--type-${reference.term_type})` }"
              ></span>
            </span>
            <span class="moment-name">{{ describeMoment(moment) }}</span>
          </span>
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.timeline {
  --bar-height: 18px;
  --lane-height: 3.25rem;
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  padding-top: 1.5rem;
  height: calc(
    1.5rem + var(--bar-height) + var(--lane-count) * var(--lane-height) + 1rem
  );
}

.timeline-ruler,
.timeline-moments {
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--muted);
}

.timeline-tick:first-child {
  transform: none;
}

.timeline-tick-end {
  right: 0;
  transform: none;
  color: var(--ink);
  font-weight: 700;
}

.timeline-bar {
  height: var(--bar-height);
  background: var(--ink);
  border-radius: 3px;
}

.timeline-moment {
  position: absolute;
  top: 1.5rem;
}

.moment-button {
  position: relative;
  display: block;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;
}

.moment-head {
  position: absolute;
  left: -2px;
  top: 0;
  width: 4px;
  height: var(--bar-height);
  background: var(--draft);
}

.moment-stem {
  position: absolute;
  left: -1px;
  top: var(--bar-height);
  width: 2px;
  height: calc(var(--lane) * var(--lane-height) + 0.75rem);
  background: var(--ink);
}

.moment-label {
  position: absolute;
  left: -1px;
  top: calc(var(--bar-height) + var(--lane) * var(--lane-height) + 0.75rem);
  z-index: 1;
  width: max-content;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: var(--space-2);
  align-items: center;
  padding: 0.2rem 0.5rem;
  border: 2px solid var(--ink);
  border-radius: 0 6px 6px 6px;
  background: var(--surface);
  white-space: nowrap;
}

.is-right .moment-label {
  left: auto;
  right: -1px;
  border-radius: 6px 0 6px 6px;
}

.moment-time {
  font-weight: 800;
  font-size: 0.9375rem;
}

.moment-swatches {
  justify-self: start;
  display: flex;
  gap: 2px;
}

.moment-swatch {
  width: 0.55rem;
  height: 0.55rem;
}

.moment-name {
  grid-column: 1 / -1;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8125rem;
  color: var(--muted);
}

.moment-button:hover .moment-label {
  border-color: var(--focus);
}

.moment-button:focus-visible {
  outline: none;
}

.moment-button:focus-visible .moment-label {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.moment-button[aria-pressed='true'] .moment-label {
  background: var(--ink);
  color: var(--paper);
}

.moment-button[aria-pressed='true'] .moment-name {
  color: var(--paper);
}

.moment-button[aria-pressed='true'] .moment-head {
  left: -4px;
  width: 8px;
}

@container (max-width: 600px) {
  .moment-name {
    display: none;
  }
}
</style>
