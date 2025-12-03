import React, { useState } from 'react';
import authAPI from '../api/auth';

const Login = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('support@appbrew.com');
  const [password, setPassword] = useState('qwerty');
  const [rememberMe, setRememberMe] = useState(false);
  const [otpMethod, setOtpMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMethodFromBackend, setOtpMethodFromBackend] = useState('email');
  const [storedCredentials, setStoredCredentials] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(identifier, password, rememberMe, otpMethod);

      if (response.data.requires_otp) {
        setRequiresOtp(true);
        setUserId(response.data.user_id);
        setOtpEmail(response.data.email);
        setOtpMethodFromBackend(response.data.otp_method || 'email');
        setStoredCredentials({ identifier, password, rememberMe, otpMethod });
        setError('');
      } else if (response.data.access && response.data.user) {
        // Direct login without OTP
        handleLoginSuccess(response.data);
      } else {
        throw new Error('Invalid response format from auth service');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                          error.response?.data?.message ||
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the same identifier that was used for login
      const identifier = storedCredentials?.identifier || otpEmail;
      const response = await authAPI.verifyOTP(identifier, otpCode);
      handleLoginSuccess(response.data);
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.detail || 'OTP verification failed.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!storedCredentials) return;

    setLoading(true);
    setError('');
    setOtpCode('');

    try {
      const response = await authAPI.login(
        storedCredentials.identifier,
        storedCredentials.password,
        storedCredentials.rememberMe,
        storedCredentials.otpMethod
      );

      if (response.data.requires_otp) {
        setUserId(response.data.user_id);
        setOtpEmail(response.data.email);
        setOtpMethodFromBackend(response.data.otp_method || 'email');
        setError('New OTP sent successfully.');
      } else {
        // Should not happen, but handle anyway
        handleLoginSuccess(response.data);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                          error.response?.data?.message ||
                          'Failed to resend OTP.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    const { access, refresh, user, tenant_id, tenant_name, tenant_primary_color, tenant_secondary_color } = data;

    // Store refresh token if provided
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }

    // Transform user data from response
    const userData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
      role: user.role,
      user_type: user.user_type,
      tenant_id,
      tenant_name,
      tenant_primary_color,
      tenant_secondary_color
    };

    onLogin(access, userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TaskFlow</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={requiresOtp ? handleVerifyOTP : handleSubmit} className="space-y-6">
          {!requiresOtp ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Email or Username</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="Enter your email or username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Remember me</span>
                </label>

                {identifier.includes('@') && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-semibold text-slate-900">OTP Method:</label>
                    <select
                      value={otpMethod}
                      onChange={(e) => setOtpMethod(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-slate-600 text-sm">
                  OTP sent to your {otpMethodFromBackend}. Please check your {otpMethodFromBackend} and enter the code below.
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Code expires in 5 minutes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">OTP Code</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequiresOtp(false);
                    setOtpCode('');
                    setStoredCredentials(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 text-slate-600 hover:text-slate-800 text-sm underline"
                >
                  Back to login
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Demo credentials: support@appbrew.com or username / qwerty
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;