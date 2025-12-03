import api from './axios';






const AUTH_BASE = 'https://server1.prolianceltd.com/api';

const authAPI = {
  login: (identifier, password, remember_me = false, otp_method = null) => {
    const isEmail = identifier.includes('@');
    return api.post(`${AUTH_BASE}/token/`, {
      [isEmail ? 'email' : 'username']: identifier,
      password,
      remember_me,
      ...(otp_method && isEmail && { otp_method })  // Only send otp_method for email logins
    });
  },

  verifyOTP: (identifier, otp_code) => {
    const isEmail = identifier.includes('@');
    return api.post(`${AUTH_BASE}/verify-otp/`, {
      [isEmail ? 'email' : 'username']: identifier,
      otp_code
    });
  },

  verifyToken: (token) => {
    return api.get(`${AUTH_BASE}/token/validate/`, {
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