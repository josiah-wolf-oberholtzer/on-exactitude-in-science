import * as QueryString from 'query-string';
import { CATEGORIES } from './constants';

const queryStringToObject = (queryString) => {
  const queryObject = {
    ...QueryString.parse(
      queryString,
      { arrayFormat: 'bracket' },
    ),
  };
  Object.entries(queryObject).forEach((entry) => {
    const [key, value] = entry;
    if (typeof value === 'string' && CATEGORIES.has(key)) {
      queryObject[key] = [value];
    }
  });
  return queryObject;
};

const queryObjectToString = (queryObject) => {
  const queryString = QueryString.stringify(
    queryObject,
    { arrayFormat: 'bracket' },
  ).replace(/%2B/g, '+').replace(/%20/g, '+');
  return (queryString.length > 0) ? `?${queryString}` : '';
};

function union(setA, setB) {
  const result = new Set(setA);
  setB.forEach((elem) => { result.add(elem); });
  return result;
}

export { queryStringToObject, queryObjectToString, union };
