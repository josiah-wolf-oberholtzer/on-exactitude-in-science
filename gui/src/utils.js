import * as QueryString from 'query-string';

const queryStringToObject = (queryString) => {
  const queryObject = {...QueryString.parse(
    queryString,
    {arrayFormat: 'bracket'},
  )};
  Object.entries(queryObject).forEach(entry => {
    const [key, value] = entry;
    if (typeof value === 'string') {
      queryObject[key] = [value];
    };
  });
  console.log("queryStringToObject", queryString, queryObject);
  return queryObject;
}

const queryObjectToString = (queryObject) => {
  const queryString = QueryString.stringify(
    queryObject,
    {arrayFormat: 'bracket'},
  ).replace(/%2B/g, '+').replace(/%20/g, '+');
  console.log("queryObjectToString", queryObject, queryString);
  return queryString;
}

export {queryStringToObject, queryObjectToString};
