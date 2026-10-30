import type { Reference } from '../../frontend/src/api/types';

export type Moment = {
  readonly seconds: number;
  readonly references: ReadonlyArray<Reference>;
};

const SECONDS_BEFORE_MOMENT = 2;
const SECONDS_AFTER_MOMENT = 12;
const SECONDS_PER_MINUTE = 60;

export function groupByTimestamp(
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

export function findActiveMoment(
  moments: ReadonlyArray<Moment>,
  progressSeconds: number,
): Moment | undefined {
  return moments.findLast(
    (moment) =>
      progressSeconds >= moment.seconds - SECONDS_BEFORE_MOMENT &&
      progressSeconds < moment.seconds + SECONDS_AFTER_MOMENT,
  );
}

export function formatTimestamp(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
