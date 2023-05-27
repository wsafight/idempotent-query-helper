import { sleep } from '@/utils/sleep';
import { retryQuery } from '@/utils/retry-query';

// queryFun,
// params,
// retryTime,
// sleepTime,
// getIsRunningByError,
// queryDone,

describe('retry Query Function', () => {
  test('basic', async () => {
    const result = await retryQuery<number>({
      queryFun: params => sleep(1).then(() => params),
      params: { id: 1 },
      retryTime: 3,
      sleepTime: 1000,
    });
    expect(result.result).toStrictEqual({ id: 1 });
  });

  test('retry time', async () => {
    let time = 0;
    const result = await retryQuery<number>({
      queryFun: params => {
        time++;
        if (time < 3) {
          throw new Error('err');
        }
        return sleep(10).then(() => params);
      },
      params: { id: 1 },
      retryTime: 3,
      sleepTime: 1000,
    });
    expect(result.result).toStrictEqual({ id: 1 });
  });

  test('retry time error', async () => {
    let time = 0;
    const result = await retryQuery<number>({
      queryFun: params => {
        time++;
        if (time < 3) {
          throw new Error('err');
        }
        return sleep(10).then(() => params);
      },
      params: { id: 1 },
      retryTime: 2,
      sleepTime: 1000,
    });
    expect(result.result).toStrictEqual(new Error('err'));
  });

  test('retry time with getIsRunningByError', async () => {
    let time = 0;
    const result = await retryQuery<number>({
      queryFun: params => {
        time++;
        if (time < 3) {
          throw new Error('err');
        }
        return sleep(10).then(() => params);
      },
      params: { id: 1 },
      retryTime: 3,
      sleepTime: 1000,
      getIsRunningByError: (err: any) => {
        return err.message === 'err';
      },
    });
    expect(result.result).toStrictEqual({ id: 1 });
  });

  test('retry time with getIsRunningByError', async () => {
    let time = 0;
    const result = await retryQuery<number>({
      queryFun: params => {
        time++;
        if (time < 3) {
          throw new Error('err');
        }
        return sleep(10).then(() => params);
      },
      params: { id: 1 },
      retryTime: 3,
      sleepTime: 1000,
      getIsRunningByError: (err: any) => {
        return err.message === 'err2';
      },
    });
    expect(result.result).toStrictEqual(new Error('err'));
  });
});
