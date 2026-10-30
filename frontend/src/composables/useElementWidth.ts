import {
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
  type ShallowRef,
} from 'vue';

export function useElementWidth(
  element: Readonly<ShallowRef<HTMLElement | null>>,
): Ref<number> {
  const width = ref(0);
  const observer = new ResizeObserver(([entry]) => {
    width.value = entry?.contentRect.width ?? 0;
  });

  onMounted(() => {
    if (element.value) {
      observer.observe(element.value);
    }
  });
  onBeforeUnmount(() => observer.disconnect());

  return width;
}
