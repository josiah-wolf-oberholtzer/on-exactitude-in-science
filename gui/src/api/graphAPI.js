import axios from 'axios';

const urlBase = (process.env.NODE_ENV === 'production') ? 'https://api.on-exactitude-in.science' : 'http://localhost:9090';
const fetchLocalityByEntity = async (label, id) => {
  const url = `${urlBase}/locality/${label}/${id}`;
  const response = await axios.get(url);
  return response;
};
const fetchLocalityByVertex = async (id) => {
  const url = `${urlBase}/locality/${id}`;
  const response = await axios.get(url);
  return response;
};
const fetchRandomVertex = async () => {
  const url = `${urlBase}/random`;
  const response = await axios.get(url);
  return response;
};
const search = async (query, label) => {
  const labels = ['artist', 'company', 'master', 'release', 'track'];
  const url = labels.includes(label) ? `${urlBase}/search/${label}` : `${urlBase}/search`;
  const response = axios.get(url, { params: { q: query } });
  return response;
};

export {
  fetchLocalityByEntity, fetchLocalityByVertex, fetchRandomVertex, search,
};
