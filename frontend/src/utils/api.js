import axios from "axios";

const API_URL = "https://mashbash.onrender.com/api/";
const PUBLIC_API_URL = "https://mashbash.onrender.com/api/public/"; // Public base URL for audience

// Helper function to get the token from localStorage and create the Authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch all matches (authenticated)
export const fetchMatches = () => {
  return axios.get(`${API_URL}matches`, {
    headers: getAuthHeader(),
  });
};

// Create a new match (authenticated)
export const createMatch = (matchData) => {
  return axios.post(`${API_URL}matches`, matchData, {
    headers: getAuthHeader(),
  });
};

// Update an existing match (authenticated)
export const updateMatch = (matchId, matchData) => {
  return axios.put(`${API_URL}matches/${matchId}`, matchData, {
    headers: getAuthHeader(),
  });
};

// Delete a match (authenticated)
export const deleteMatch = (matchId) => {
  return axios.delete(`${API_URL}matches/${matchId}`, {
    headers: getAuthHeader(),
  });
};

// Fetch a single match by ID (authenticated)
export const fetchMatch = (matchId) => {
  return axios.get(`${API_URL}matches/${matchId}`, {
    headers: getAuthHeader(),
  });
};

// Export matches to Excel (authenticated)
export const exportMatches = async () => {
  try {
    const response = await axios.get(`${API_URL}export`, {
      headers: getAuthHeader(),
      responseType: "blob", // Handle file download
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "matches.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    throw error;
  }
};

// Fetch a single match by ID for public view (no authentication)
export const fetchPublicMatch = (matchId) => {
  return axios.get(`${PUBLIC_API_URL}matches/${matchId}`);
};