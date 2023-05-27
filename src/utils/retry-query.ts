import {
  GetIsRunningByErrorFun,
  QueryDoneFun,
  QueryFun,
  QueryFunResult,
} from '../interface';
import { sleep } from './sleep';

interface RetryQueryFunParams<R> {
  queryFun: QueryFun;
  params: Record<string, any>;
  retryTime: number;
  sleepTime: number;
  getIsRunningByError?: GetIsRunningByErrorFun;
  queryDone?: QueryDoneFun<R>;
}

export const retryQuery = async <R>({
  queryFun,
  params,
  retryTime,
  sleepTime,
  getIsRunningByError,
  queryDone,
}: RetryQueryFunParams<R>): Promise<QueryFunResult<R>> => {
  let currentRetryTime = retryTime;

  const handleError = (error: unknown): QueryFunResult<R> => {
    queryDone?.(error, null);
    return {
      status: 'error',
      result: error,
    };
  };
  const hasGetIsRunningByErrorFun = typeof getIsRunningByError === 'function';

  while (currentRetryTime > 0) {
    currentRetryTime--;
    try {
      const res = await queryFun(params);
      queryDone?.(null, res);
      return {
        status: 'success',
        result: res,
      };
    } catch (error) {
      if (hasGetIsRunningByErrorFun) {
        const isContinueRun = getIsRunningByError(error);
        if (!isContinueRun) {
          return handleError(error);
        }
      }

      if (currentRetryTime === 0) {
        return handleError(error);
      }
    }

    await sleep(sleepTime);
  }
  return {
    status: 'error',
    result: new Error('retryQuery Funcion Error'),
  };
};
