import { log } from "@/utils/log.ts";

export const fetchData = async <T extends readonly (unknown | PromiseLike<unknown>)[]>(
  fetchers: [...T],
  setters: { [K in keyof T]: (value: Awaited<T[K]>) => void },
  setLoading: (loading: boolean) => void,
) => {
  try {
    setLoading(true);
    const results = await Promise.all(fetchers);
    (setters as ((value: unknown) => void)[]).forEach((setter, index) => {
      setter(results[index]);
    });
  } catch (error) {
    log.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};
