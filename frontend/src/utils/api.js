// src/utils/api.js
import axios from "axios";

const API_URL = "https://mashbash.onrender.com/api/"; // Hardcode the production URL

export const fetchMatches = () => axios.get(`${API_URL}matches`);
export const createMatch = (matchData) => axios.post(`${API_URL}matches`, matchData);
export const updateMatch = (matchId, matchData) => axios.put(`${API_URL}matches/${matchId}`, matchData);
export const deleteMatch = (matchId) => axios.delete(`${API_URL}matches/${matchId}`);
export const fetchMatch = (matchId) => axios.get(`${API_URL}matches/${matchId}`);
export const exportMatches = () => window.location.href = `${API_URL}export`;