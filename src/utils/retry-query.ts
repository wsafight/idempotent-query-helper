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
      const isRunning = getIsRunningByError
        ? getIsRunningByError(error)
        : false;
      if (retryTime === 0 || !isRunning) {
        queryDone?.(error, null);
        return {
          status: 'error',
          result: error,
        };
      }
    }
    await sleep(sleepTime);
  }
  return {
    status: 'error',
    result: new Error('retryQuery Funcion Error'),
  };
};
