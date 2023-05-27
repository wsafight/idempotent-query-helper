import { idenpotentQuery, sleep } from '@/index';

describe('Default cases', () => {
  test('hello world test', () => {
    const s = 'hello Modern.js';
    expect(s).toBe('hello Modern.js');
  });

  test('basic', async () => {
    const result = await idenpotentQuery({
      queryFun: (params: any) => {
        return sleep(10).then(() => params);
      },
      queryParam: [{ id: 1 }, { id: 2 }, { id: 3 }],
      options: {
        getTraceId: (item, index) => {
          return `${item}:${index}`;
        },
        concurrency: 2,
      },
    });
    expect(result).toStrictEqual([{ status: 'success' }]);
  });
});
