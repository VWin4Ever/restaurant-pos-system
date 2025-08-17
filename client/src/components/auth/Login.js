import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../common/Icon';
import logo from '../../assets/logo.png';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required')
}).required();

const Login = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/20 to-accent-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-200/20 to-primary-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-100/10 to-accent-100/10 rounded-full blur-3xl animate-pulse-gentle"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Enhanced Brand Section */}
        <div className="flex flex-col items-center mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative mb-4">
            <img src={logo} alt="Angkor Holiday Hotel Logo" className="h-32 w-auto rounded-2xl shadow-soft border-2 border-white/50" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-2xl"></div>
          </div>
          <h2 className="text-2xl font-bold text-primary text-center leading-tight">
            Welcome to Angkor Holiday Hotel POS
          </h2>
          <p className="text-neutral-500 text-center mt-2">
            Secure restaurant management system
          </p>
        </div>

        {/* Enhanced Form Card */}
        <div className="card-gradient p-8 animate-slide-up shadow-large border border-white/20" style={{ animationDelay: '200ms' }}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="username" className="form-label flex items-center">
                  <Icon name="profile" size="sm" className="mr-2 text-primary-600" />
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon name="profile" size="sm" className="text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    {...register('username')}
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    className={`input pl-12 pr-4 transition-all duration-300 ${
                      errors.username 
                        ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500' 
                        : 'border-neutral-200 focus:ring-primary-500/20 focus:border-primary-600 hover:border-primary-300'
                    }`}
                    placeholder="Enter your username"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                {errors.username && (
                  <p className="form-error animate-shake">
                    <Icon name="error" size="sm" className="mr-1" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label flex items-center">
                  <Icon name="eye" size="sm" className="mr-2 text-primary-600" />
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon name="eye" size="sm" className="text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    {...register('password')}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`input pl-12 pr-12 transition-all duration-300 ${
                      errors.password 
                        ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500' 
                        : 'border-neutral-200 focus:ring-primary-500/20 focus:border-primary-600 hover:border-primary-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} size="sm" />
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error animate-shake">
                    <Icon name="error" size="sm" className="mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center py-4 text-lg font-semibold relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 group-hover:from-primary-700 group-hover:to-primary-800 transition-all duration-300"></div>
                <div className="relative flex items-center">
                  {isLoading ? (
                    <div className="loading-spinner mr-3"></div>
                  ) : (
                    <Icon name="check" size="sm" className="mr-3 group-hover:scale-110 transition-transform" />
                  )}
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
            <Icon name="check" size="xs" className="text-success" />
            <span>Secure restaurant management system</span>
          </div>
          <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-neutral-400">
            <span className="flex items-center">
              <Icon name="shield" size="xs" className="mr-1" />
              SSL Encrypted
            </span>
            <span className="flex items-center">
              <Icon name="clock" size="xs" className="mr-1" />
              24/7 Support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 