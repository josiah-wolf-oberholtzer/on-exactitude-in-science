import * as QueryString from 'query-string';

const queryStringToObject = (queryString) => {
  const queryObject = {...QueryString.parse(queryString, {arrayFormat: 'comma'})};
  Object.entries(queryObject).forEach(entry => {
    const [key, value] = entry;
    if (typeof value === 'string') {
      queryObject[key] = [value];
    };
  });
  return queryObject;
}

const queryObjectToString = (queryObject) => {
  return QueryString.stringify(
    queryObject,
    {arrayFormat: 'comma'},
  ).replace(/%2B/g, '+').replace(/%20/g, '+');
}

export {queryStringToObject, queryObjectToString};
