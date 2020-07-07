import axios from 'axios';

const urlBase = 'http://localhost:9090';

export const fetchGraphByEntity = async (label, id, roles = []) => {
  const url = `${urlBase}/locality/${label}/${id}`,
    response = await axios.get(url);
  return response;
};

export const fetchGraphByVertex = async (id, roles = []) => {
  const url = `${urlBase}/locality/${id}`,
    response = await axios.get(url);
  return response;
};

export const fetchRandomVertex = async () => {
  const url = `${urlBase}/random`,
    response = await axios.get(url);
  return response;
};

export const search = async (query) => {
  const url = `${urlBase}/search`,
    response = axios.get(url, {params: {q: query}});
  return response;
}
