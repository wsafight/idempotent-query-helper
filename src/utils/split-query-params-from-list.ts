export interface SplitQueryParamsFromListFunParams<T> {
  allQuery: T[];
  singleQueryParamsCount: number;
}

export const splitQueryParamsFromList = <T>({
  allQuery,
  singleQueryParamsCount,
}: SplitQueryParamsFromListFunParams<T>): T[][] => {
  const queryList: T[][] = [];
  for (let idx = 0; idx < allQuery.length; idx += singleQueryParamsCount) {
    queryList.push(allQuery.slice(idx, idx + singleQueryParamsCount));
  }
  return queryList;
};
