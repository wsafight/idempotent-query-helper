import { splitQueryParamsFromList } from './utils/split-query-params-from-list';
import { limitQuery } from './utils/limit-query';
import { sleep } from './utils/sleep';
import { retryQuery } from './utils/retry-query';
import {
  GetIsRunningByErrorFun,
  GetRetryTimeByErrorFun,
  GetTraceIdFun,
  QueryDoneFun,
  QueryFunResult,
} from './interface';

interface BatchRetryQueryFunQuery<T, R> {
  queryFun: (param: any) => any;
  paramsList: T[][];
  traceIds: string[];
  traceIdKey: string;
  sleepTime: number;
  retryQueryTimeByQueryIndex: Record<string, number>;
  getIsRunningByError?: GetIsRunningByErrorFun;
  queryDone?: QueryDoneFun<R>;
}

const batchRetryQuery = async <T, R>({
  queryFun,
  paramsList,
  traceIds,
  traceIdKey,
  retryQueryTimeByQueryIndex,
  sleepTime,
  getIsRunningByError,
  queryDone,
}: BatchRetryQueryFunQuery<T, R>): Promise<
  Record<string, QueryFunResult<R>>
> => {
  const retryQueryIndex = Object.keys(retryQueryTimeByQueryIndex);

  if (Object.keys(retryQueryTimeByQueryIndex).length === 0) {
    return {};
  }

  await sleep(sleepTime);

  const resultByIndex: Record<number, QueryFunResult<R>> = {};
  for (const index of retryQueryIndex) {
    const currentIndex = Number(index);
    const currentRetryTime = retryQueryTimeByQueryIndex[currentIndex];
    const currentParams = paramsList[currentIndex];
    const result = await retryQuery<R>({
      queryFun,
      params: {
        ...currentParams,
        [traceIdKey]: traceIds[currentIndex],
      },
      getIsRunningByError,
      retryTime: currentRetryTime,
      sleepTime,
      queryDone,
    });
    resultByIndex[currentIndex] = result;
  }
  return resultByIndex;
};

interface IdenpotentQueryFunParams<T, R> {
  queryFun: (param: any) => any;
  queryParams: T[];
  options: {
    concurrency?: number;
    traceIdKey?: string;
    sleepTime?: number;
    singleQueryParamsCount?: number;
    getTraceId?: GetTraceIdFun<T>;
    getRetryTimeByError?: GetRetryTimeByErrorFun;
    getIsRunningByError?: GetIsRunningByErrorFun;
    singleQueryDone?: QueryDoneFun<R>;
  };
}

const DEFAULT_CONCURRENCY = 6;

const idenpotentQuery = async <T, R>({
  queryFun,
  queryParams = [],
  options = {
    sleepTime: 2000,
    concurrency: DEFAULT_CONCURRENCY,
    traceIdKey: 'traceId',
  },
}: IdenpotentQueryFunParams<T, R>): Promise<QueryFunResult<R>[]> => {
  if (!queryFun || typeof queryFun !== 'function') {
    throw new Error('queryFun must be a function');
  }

  if (queryParams === undefined || queryParams === null) {
    throw new Error('queryParam cannot empty');
  }

  if (!Array.isArray(queryParams)) {
    throw new Error('queryParam must be a Array');
  }

  const {
    concurrency = DEFAULT_CONCURRENCY,
    traceIdKey = 'traceId',
    getTraceId,
    singleQueryParamsCount,
    singleQueryDone,
    getRetryTimeByError,
    getIsRunningByError,
    sleepTime = 2000,
  } = options;

  if (typeof getTraceId !== 'function') {
    throw new Error('getTraceId must be a function');
  }

  let finalQueryParamsCount: number = queryParams.length;

  const hasSingleQueryParamsCountParam =
    typeof singleQueryParamsCount === 'number' && singleQueryParamsCount > 0;

  if (hasSingleQueryParamsCountParam) {
    finalQueryParamsCount = singleQueryParamsCount;
  }

  const paramsList = splitQueryParamsFromList<T>({
    allQuery: queryParams,
    singleQueryParamsCount: finalQueryParamsCount,
  });

  const traceIds: string[] = [];

  paramsList.forEach((item, index) => traceIds.push(getTraceId(item, index)));

  const queryFunList = paramsList.map(
    (item, idx) => () =>
      queryFun({
        ...item,
        [traceIdKey]: traceIds[idx],
      }),
  );
  const allResult: QueryFunResult<R>[] = await limitQuery<R>({
    tasks: queryFunList,
    concurrency,
    singleQueryDone,
  });

  const apiErrorByIndex: Record<number, Error> = {};

  allResult.forEach((currentResult, index) => {
    if (currentResult.status !== 'error') {
      return;
    }
    apiErrorByIndex[index] = currentResult.result as Error;
  });

  const apiErrorIndex: number[] = Object.keys(apiErrorByIndex).map(Number);

  const retryQueryTimeByQueryIndex: Record<number, number> = {};

  if (apiErrorIndex.length) {
    apiErrorIndex.forEach(index => {
      const currentErr: Error = apiErrorByIndex[index]!;
      const retryTime = getRetryTimeByError
        ? getRetryTimeByError(currentErr)
        : 1;
      if (retryTime <= 0) {
        return;
      }
      retryQueryTimeByQueryIndex[index] = retryTime;
    });
  }

  if (Object.keys(retryQueryTimeByQueryIndex).length) {
    const retryResultByIndex = await batchRetryQuery({
      queryFun,
      paramsList,
      traceIds,
      traceIdKey,
      sleepTime,
      retryQueryTimeByQueryIndex,
      getIsRunningByError,
      queryDone: singleQueryDone,
    });
    Object.keys(retryResultByIndex).forEach(index => {
      allResult[Number(index)] = retryResultByIndex[index];
    });
  }

  return allResult;
};

export {
  batchRetryQuery,
  idenpotentQuery,
  splitQueryParamsFromList,
  limitQuery,
  sleep,
  retryQuery,
};

export default idenpotentQuery;
