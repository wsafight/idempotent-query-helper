import { QueryFunResult } from '../interface';

interface LimitQueryFunParams<R> {
  tasks: ((params: any) => any)[];
  concurrency: number;
  singleQueryDone?: (err: any, result: R) => void;
}

export const limitQuery = async <R>({
  tasks,
  concurrency,
  singleQueryDone,
}: LimitQueryFunParams<R>): Promise<QueryFunResult<R>[]> => {
  const results: QueryFunResult<R>[] = [];

  const runTasks = async (tasksIterator: IterableIterator<any>) => {
    for (const [index, task] of tasksIterator) {
      try {
        const result = await task();
        results[index] = {
          status: 'success',
          result,
        };
        singleQueryDone?.(null, result);
      } catch (error) {
        results[index] = {
          status: 'error',
          result: error,
        };
      }
    }
  };

  const workers = new Array(concurrency).fill(tasks.entries()).map(runTasks);

  await Promise.allSettled(workers);

  return results;
};
