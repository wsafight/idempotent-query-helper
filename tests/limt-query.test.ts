import { sleep } from '@/utils/sleep';
import { limitQuery } from '@/utils/limit-query';

// For the convenience of testing, it has been reduced by 10 times here

const sleep1s = () => sleep(100).then(() => 'sleep one second');

const sleep2s = () => sleep(200).then(() => 'sleep two seconds');

const sleep3s = () => sleep(300).then(() => 'sleep three seconds');

const sleepThrow = () =>
  sleep(50).then(() => {
    throw new Error('error');
  });

describe('Limit Query Function', () => {
  test('base', async () => {
    const res = await limitQuery<string>({
      tasks: [sleep2s, sleep1s, sleep3s],
      concurrency: 1,
    });
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep two seconds',
      'sleep one second',
      'sleep three seconds',
    ]);
  });

  test('concurrency', async () => {
    const res = await limitQuery<string>({
      tasks: [sleep2s, sleep1s, sleep3s],
      concurrency: 2,
    });
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep two seconds',
      'sleep one second',
      'sleep three seconds',
    ]);
  });

  test('order', async () => {
    const res = await limitQuery({
      tasks: [sleep3s, sleep1s, sleep1s],
      concurrency: 2,
    });
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep three seconds',
      'sleep one second',
      'sleep one second',
    ]);
  });

  test('over concurrency number', async () => {
    const res = await limitQuery({
      tasks: [sleep3s, sleep1s, sleep1s],
      concurrency: 3,
    });
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep three seconds',
      'sleep one second',
      'sleep one second',
    ]);
  });

  test('error order', async () => {
    const res = await limitQuery({
      tasks: [sleep3s, sleepThrow, sleep1s],
      concurrency: 2,
    });
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep three seconds',
      new Error('error'),
      'sleep one second',
    ]);
  });

  test('error order', async () => {
    const res = await limitQuery({
      tasks: [sleep3s, sleepThrow, sleep1s],
      concurrency: 2,
    });
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep three seconds',
      new Error('error'),
      'sleep one second',
    ]);
  });

  test('singleQueryDone function', async () => {
    let successCount = 0;
    const res = await limitQuery({
      tasks: [sleep3s, sleepThrow, sleep1s],
      concurrency: 2,
      singleQueryDone: (err, result) => {
        if (result) {
          successCount += 1;
        }
      },
    });
    expect(successCount).toBe(2);
    expect(res.map(item => item.result)).toStrictEqual([
      'sleep three seconds',
      new Error('error'),
      'sleep one second',
    ]);
  });
});
