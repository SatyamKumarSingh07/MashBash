import axios from "axios";

const API_URL = "https://mashbash.onrender.com/api/";
const PUBLIC_API_URL = "https://mashbash.onrender.com/api/public/";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

axios.defaults.timeout = 10000;

export const fetchMatches = () => {
  return axios.get(`${API_URL}matches`, {
    headers: getAuthHeader(),
  });
};

export const createMatch = (matchData) => {
  return axios.post(`${API_URL}matches`, matchData, {
    headers: getAuthHeader(),
  });
};

export const updateMatch = (matchId, matchData) => {
  return axios.put(`${API_URL}matches/${matchId}`, matchData, {
    headers: getAuthHeader(),
  });
};

export const deleteMatch = (matchId) => {
  return axios.delete(`${API_URL}matches/${matchId}`, {
    headers: getAuthHeader(),
  });
};

export const fetchMatch = (matchId) => {
  return axios.get(`${API_URL}matches/${matchId}`, {
    headers: getAuthHeader(),
  });
};

export const exportMatches = async () => {
  try {
    const response = await axios.get(`${API_URL}export`, {
      headers: getAuthHeader(),
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "matches.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Failed to export matches:", error.message);
    alert("Failed to export matches. Please try again or check the console for details.");
    throw error;
  }
};

export const fetchPublicMatches = () => {
  return axios.get(`${PUBLIC_API_URL}matches`);
};