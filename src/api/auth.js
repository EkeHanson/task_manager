import api from './axios';

const AUTH_BASE = 'https://server1.prolianceltd.com/api';

const authAPI = {
  login: (identifier, password) => {
    const isEmail = identifier.includes('@');
    return api.post(`${AUTH_BASE}/token/`, {
      [isEmail ? 'email' : 'username']: identifier,
      password
    });
  },

  verifyToken: (token) => {
    return api.get(`${AUTH_BASE}/verify/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getUsers: () => {
    return api.get(`${AUTH_BASE}/user/users/`);
  }
};

export default authAPI;