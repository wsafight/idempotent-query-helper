# idempotent-query-helper


Read this in other languages:
[English](https://github.com/wsafight/idempotent-query-helper/blob/main/README.EN.md)

幂等请求辅助工具

开发历程可以参考博客
[手写一个幂等请求工具库 idempotent-query-helper](https://github.com/wsafight/personBlog/issues/59)


## 特性

- [x] 批量操作
- [x] 顺序返回

## 安装

```bash
npm install idempotent-query-helper
```

或者

```bash
yarn add idempotent-query-helper
```

## 用法

### 参数

```ts
interface IdenpotentQueryFunParams<T, R> {
  /** 请求函数 */
  queryFun: (param: any) => any;
  /** 请求参数数组 */
  queryParams: T[];
  /** 配置项 */
  options: {
    /** 分组后请求的参数 */
    queryKey?: string;
    /** 并发数  */
    concurrency?: number;
    /** 幂等请求参数的 key */
    traceIdKey?: string;
    /** 据当前参数和 index 获取 tradeId  */
    getTraceId?: GetTraceIdFun<T>;
    /** 失败后等待时间(毫秒) */
    sleepTime?: number;
    /** 单次请求数组数量 */
    singleQueryParamsCount?: number;
    /** 数字或根据当前错误生成数量的函数  */
    retryTime?: number | GetRetryTimeByErrorFun;
    /** 根据当前错误决定是否继续执行重试  */
    getIsRunningByError?: GetIsRunningByErrorFun;
    /** 单次请求结束后执行函数  */
    singleQueryDone?: QueryDoneFun<R>;
  };
}
```

| 参数                | 说明                       | 类型                                             | 默认值       |
| :---------------- | :----------------------- | :--------------------------------------------- | :-------- |
|   queryFun          |    请求函数                   |                          function   |     -    |
|   queryParams          |    请求参数数组                  |                          param[]   |     []    |
|   options.queryKey          |    分组后请求的参数 key                  |                          string   |     'batchQueryItem'    |
|   options.concurrency    |    并发数      |                          number   |     6   |
|   options.traceIdKey          |    幂等请求参数的 key                  |                          string   |    'traceId'     |
|   options.sleepTime          |    失败后等待时间(毫秒)                  |                          number   |     2000   |
|   options.singleQueryParamsCount          |    单次请求数组数量                  |                          number   |    1    |
|   options.getTraceId          |    根据当前参数和 index 获取 tradeId                   |                          function   |     (item, index) => string   |
|   options.retryTime          |    数字或根据当前错误生成数量的函数               |                          number｜function   |     3    |
|   options.getIsRunningByError          |    根据当前错误决定是否继续执行重试                  |                          function   |     -    |
|   options.singleQueryDone          |    单次请求结束后执行函数                   |                          function   |     -    |

### 返回值

```ts
export interface QueryFunResult<R> {
  /** 成功或者错误 */
  status: 'success' | 'error';
  /** 对应上面成功失败，返回结果或者错误 */
  result: R | unknown;
}
```

### 例子

```ts
const errCode: Record<string, number> = {};
const result = await idenpotentQuery({
  // 请求函数
  queryFun: (params: any) => {
    const currentParamsStr = JSON.stringify(params);
    errCode[currentParamsStr] = (errCode[currentParamsStr] || 0) + 1;
    // 第一次和第二次会报错
    if (errCode[currentParamsStr] < 3) {
      throw new Error('retry');
    }
    return sleep(10).then(() => params.batchQueryItem);
  },
  // 当前请求参数
  queryParams: [3, 2, 1],
  options: {
    // 生成的 traceId 后端要在一定时间内唯一
    getTraceId: (item, index) => `${index}`,
    // 重试次数
    retryTime: () => 2,
    // 并发请求数量 2
    concurrency: 2,
    // 单次请求数组数量
    singleQueryParamsCount: 2,
  },
});

// 返回结果
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

// 将 errCode[currentParamsStr] < 3
// 改为 errCode[currentParamsStr] < 4
// 返回结果
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

- 0.0.1 基本可用
