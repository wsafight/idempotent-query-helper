# idempotent-query-helper

Idempotent Request Helper

## Features

- [x] batch operation
- [x] order return

## Install

```bash
npm install idempotent-query-helper
```

or

```bash
yarn add idempotent-query-helper
```


## Install

```bash
npm install tool-library-template
```

Or

```bash
yarn add tool-library-template
```

## Usage

### parameter

```ts
interface IdenpotentQueryFunParams<T, R> {
  /** request function */
  queryFun: (param: any) => any;
  /** array of request parameters */
  queryParams: T[];
  /** configuration item */
  options: {
    /** Parameters requested after grouping */
    queryKey?: string;
    /** concurrent number  */
    concurrency?: number;
    /** The key of the idempotent request parameter */
    traceIdKey?: string;
    /** Get tradeId according to current parameters and index  */
    getTraceId?: GetTraceIdFun<T>;
    /** Waiting time after defeat (milliseconds) */
    sleepTime?: number;
    /** The number of arrays in a single request */
    singleQueryParamsCount?: number;
    /** A number or a function that generates a number based on the current error  */
    retryTime?: number | GetRetryTimeByErrorFun;
    /** Determine whether to continue retrying based on the current error  */
    getIsRunningByError?: GetIsRunningByErrorFun;
    /** Execute function after a single request  */
    singleQueryDone?: QueryDoneFun<R>;
  };
}
```

| 参数                | 说明                       | 类型                                             | 默认值       |
| :---------------- | :----------------------- | :--------------------------------------------- | :-------- |
|   queryFun          |    request function              |                          function   |     -    |
|   queryParams          |    array of request parameters               |                          param[]   |     []    |
|   options.queryKey          |    Parameters requested after groupingkey                  |                          string   |     'batchQueryItem'    |
|   options.concurrency    |    concurrent number      |                          number   |     6   |
|   options.traceIdKey          |    The key of the idempotent request parameter          |                          string   |    'traceId'     |
|   options.sleepTime          |    Waiting time after defeat (milliseconds)   |                          number   |     2000   |
|   options.singleQueryParamsCount          |    The number of arrays in a single request                |                          number   |    1    |
|   options.getTraceId          |    Get tradeId according to current parameters and indextradeId                   |                          function   |     (item, index) => string   |
|   options.retryTime          |    A number or a function that generates a number based on the current error             |                          number｜function   |     3    |
|   options.getIsRunningByError          |    Determine whether to continue retrying based on the current error                 |                          function   |     -    |
|   options.singleQueryDone          |    Execute function after a single request               |                          function   |     -    |

### return value

```ts
export interface QueryFunResult<R> {
  /** success or error */
  status: 'success' | 'error';
  /** Corresponding to the above success or failure, return result or error */
  result: R | unknown;
}
```

### example

```ts
const errCode: Record<string, number> = {};
const result = await idenpotentQuery({
  // request function
  queryFun: (params: any) => {
    const currentParamsStr = JSON.stringify(params);
    errCode[currentParamsStr] = (errCode[currentParamsStr] || 0) + 1;
    // 第一次和第二次会报错
    if (errCode[currentParamsStr] < 3) {
      throw new Error('retry');
    }
    return sleep(10).then(() => params.batchQueryItem);
  },
  // current request parameter
  queryParams: [3, 2, 1],
  options: {
    // The generated traceId backend must be unique within a certain period of time
    getTraceId: (item, index) => `${index}`,
    // number of retries
    retryTime: () => 2,
    // Number of concurrent requests 2
    concurrency: 2,
    // The number of arrays in a single request
    singleQueryParamsCount: 2,
  },
});

// return result
[
  {
    status: 'success'
    result: [3,2]
  },
  {
    status: 'success'
     result: [1]
  },
]

// errCode[currentParamsStr] < 3
// changed to
// errCode[currentParamsStr] < 4
// return result
[
  {
    status: 'error'
    result: [Error: retry],
  },
  {
    status: 'error'
    result: [Error: retry],
  },
]
```

## Changelog

- 0.0.1 basically available
