import { splitQueryParamsFromList } from '@/utils/split-query-params-from-list';

describe('split Query Params Function', () => {
  test('basic', () => {
    const queryParmas = [1, 2, 3, 4];

    expect(
      splitQueryParamsFromList<number>({
        allQuery: queryParmas,
        singleQueryParamsCount: 2,
      }),
    ).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test('equal number', () => {
    const queryParmas = [1, 2, 3, 4];

    expect(
      splitQueryParamsFromList<number>({
        allQuery: queryParmas,
        singleQueryParamsCount: 4,
      }),
    ).toStrictEqual([[1, 2, 3, 4]]);
  });

  test('over number', () => {
    const queryParmas = [1, 2, 3, 4];

    expect(
      splitQueryParamsFromList<number>({
        allQuery: queryParmas,
        singleQueryParamsCount: 5,
      }),
    ).toStrictEqual([[1, 2, 3, 4]]);
  });
});
