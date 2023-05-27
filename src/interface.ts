export interface QueryFunResult<R> {
  status: 'success' | 'error';
  result: R | unknown;
}

export type QueryFun = (params: any) => any;
export type GetTraceIdFun<T> = (params?: T[], index?: number) => string;
export type GetRetryTimeByErrorFun = (error: unknown) => number;
export type GetIsRunningByErrorFun = (error: unknown) => boolean;
export type QueryDoneFun<R> = (err: unknown | null, result: R | null) => void;
