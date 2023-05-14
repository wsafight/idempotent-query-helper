import { nanoid } from 'nanoid';
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
  queryKey?: string;
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
  queryKey,
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
  const hasQueryKey = typeof queryKey === 'string' && queryKey.length > 0;
  for (const index of retryQueryIndex) {
    const currentIndex = Number(index);
    const currentRetryTime = retryQueryTimeByQueryIndex[currentIndex];
    const currentParams = paramsList[currentIndex];
    const result = await retryQuery<R>({
      queryFun,
      params: {
        ...(hasQueryKey ? { [queryKey]: currentParams } : currentParams[0]),
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
  queryParam: T | T[];
  options: {
    queryKey?: string;
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
  queryParam = [],
  options = {
    queryKey: '',
    sleepTime: 2000,
    concurrency: DEFAULT_CONCURRENCY,
    traceIdKey: 'traceId',
  },
}: IdenpotentQueryFunParams<T, R>): Promise<QueryFunResult<R>[]> => {
  if (!queryFun || typeof queryFun !== 'function') {
    throw new Error('queryFun must be a function');
  }

  if (queryParam === undefined || queryParam === null) {
    throw new Error('queryParam cannot empty');
  }

  const isMultipleQueryParams = Array.isArray(queryParam);

  const queryParams: T[] = isMultipleQueryParams ? queryParam : [queryParam];

  const {
    concurrency = DEFAULT_CONCURRENCY,
    traceIdKey = 'traceId',
    getTraceId,
    singleQueryParamsCount,
    singleQueryDone,
    getRetryTimeByError,
    getIsRunningByError,
    sleepTime = 2000,
    queryKey,
  } = options;

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
  if (typeof getTraceId === 'function') {
    paramsList.forEach(item => traceIds.push(getTraceId(item)));
  } else {
    paramsList.forEach(_item => traceIds.push(nanoid()));
  }

  const hasQueryKey = typeof queryKey === 'string' && queryKey.length > 0;

  const queryFunList = paramsList.map(
    (item, idx) => () =>
      queryFun({
        ...(hasQueryKey ? { [queryKey]: item } : item[0]),
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
      queryKey,
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
  nanoid,
  splitQueryParamsFromList,
  limitQuery,
  sleep,
  retryQuery,
};

export default idenpotentQuery;
