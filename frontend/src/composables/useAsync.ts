import { ref, shallowRef, type Ref, type ShallowRef } from 'vue';

import { getErrorMessage } from '@/api/client';

export type AsyncState<TData> = {
  readonly data: ShallowRef<TData | undefined>;
  readonly error: Ref<string | undefined>;
  readonly isLoading: Ref<boolean>;
  readonly reload: () => Promise<void>;
};

export function useAsync<TData>(load: () => Promise<TData>): AsyncState<TData> {
  const data = shallowRef<TData>();
  const error = ref<string>();
  const isLoading = ref(true);

  async function reload(): Promise<void> {
    isLoading.value = true;
    error.value = undefined;
    try {
      data.value = await load();
    } catch (failure: unknown) {
      error.value = getErrorMessage(failure);
    } finally {
      isLoading.value = false;
    }
  }

  void reload();
  return { data, error, isLoading, reload };
}
