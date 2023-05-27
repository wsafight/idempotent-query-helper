import { idenpotentQuery, sleep } from '@/index';

describe('Default cases', () => {
  test('basic', async () => {
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        return sleep(10).then(() => params.query);
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
        return sleep(10).then(() => params.query);
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
    let errindex = 0;
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        if (errindex++ === 1) {
          throw new Error('retry');
        }
        return sleep(10).then(() => params.query);
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
    let errindex = 0;
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        if (errindex++ === 1) {
          throw new Error('retry');
        }
        return sleep(10).then(() => params.query);
      },
      queryParams: [3, 2, 1],

      options: {
        getTraceId: (item, index) => {
          return `${index}`;
        },
        getRetryTimeByError: () => 0,
        concurrency: 2,
        singleQueryParamsCount: 2,
      },
    });
    expect(result.map(item => item.result)).toStrictEqual([
      [3, 2],
      new Error('retry'),
    ]);
  });
});
