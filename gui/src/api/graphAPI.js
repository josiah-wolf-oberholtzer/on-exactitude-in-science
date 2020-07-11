import axios from 'axios';

const urlBase = 'http://localhost:9090',
  fetchLocalityByEntity = async (label, id) => {
    const url = `${urlBase}/locality/${label}/${id}`,
      response = await axios.get(url);
    return response;
  },
  fetchLocalityByVertex = async (id) => {
    const url = `${urlBase}/locality/${id}`,
      response = await axios.get(url);
    return response;
  },
  fetchRandomVertex = async () => {
    const url = `${urlBase}/random`,
      response = await axios.get(url);
    return response;
  },
  search = async (query) => {
    const url = `${urlBase}/search`,
      response = axios.get(url, { params: { q: query } });
    return response;
  };

export {
  fetchLocalityByEntity, fetchLocalityByVertex, fetchRandomVertex, search,
};
