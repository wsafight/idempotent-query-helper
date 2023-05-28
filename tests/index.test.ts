import { idenpotentQuery, sleep } from '@/index';

describe('Default cases', () => {
  test('basic', async () => {
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        return sleep(10).then(() => params.batchQueryItem);
      },
      queryParams: [3, 2, 1],
      options: {
        getTraceId: (item, index) => {
          return `${index}`;
        },
        concurrency: 2,
      },
    });
    expect(result.map(item => item.result)).toStrictEqual([[3], [2], [1]]);
  });

  test('singleQueryParamsCount', async () => {
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        return sleep(10).then(() => params.batchQueryItem);
      },
      queryParams: [3, 2, 1],
      options: {
        getTraceId: (item, index) => {
          return `${index}`;
        },
        concurrency: 2,
        singleQueryParamsCount: 2,
      },
    });
    expect(result.map(item => item.result)).toStrictEqual([[3, 2], [1]]);
  });

  test('singleQueryParamsCount', async () => {
    const errCode: Record<string, number> = {};
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        const currentParamsStr = JSON.stringify(params);
        errCode[currentParamsStr] = (errCode[currentParamsStr] || 0) + 1;
        if (errCode[currentParamsStr] === 1) {
          throw new Error('retry');
        }
        return sleep(10).then(() => params.batchQueryItem);
      },
      queryParams: [3, 2, 1],
      options: {
        getTraceId: (item, index) => {
          return `${index}`;
        },
        concurrency: 2,
        singleQueryParamsCount: 2,
      },
    });
    expect(result.map(item => item.result)).toStrictEqual([[3, 2], [1]]);
  });

  test('singleQueryParamsCount', async () => {
    const errCode: Record<string, number> = {};
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        const currentParamsStr = JSON.stringify(params);
        errCode[currentParamsStr] = (errCode[currentParamsStr] || 0) + 1;
        if (errCode[currentParamsStr] === 1) {
          throw new Error('retry');
        }
        return sleep(10).then(() => params.batchQueryItem);
      },
      queryParams: [3, 2, 1],

      options: {
        getTraceId: (item, index) => {
          return `${index}`;
        },
        retryTime: () => 0,
        concurrency: 2,
        singleQueryParamsCount: 2,
      },
    });
    expect(result.map(item => item.result)).toStrictEqual([[3, 2], [1]]);
  });

  test('singleQueryParamsCount', async () => {
    const errCode: Record<string, number> = {};
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        const currentParamsStr = JSON.stringify(params);
        errCode[currentParamsStr] = (errCode[currentParamsStr] || 0) + 1;
        if (errCode[currentParamsStr] < 3) {
          throw new Error('retry');
        }
        return sleep(10).then(() => params.batchQueryItem);
      },
      queryParams: [3, 2, 1],

      options: {
        getTraceId: (item, index) => {
          return `${index}`;
        },
        retryTime: () => 2,
        concurrency: 2,
        singleQueryParamsCount: 2,
      },
    });
    expect(result.map(item => item.result)).toStrictEqual([[3, 2], [1]]);
  }, 10000);
});
