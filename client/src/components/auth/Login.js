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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-accent-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-200/30 to-primary-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-slide-down">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-soft border border-primary-200/50">
            <Icon name="home" size="2xl" color="#0ea5e9" />
          </div>
          <h2 className="mt-6 text-4xl font-bold text-gradient">
            Restaurant POS
          </h2>
          <p className="mt-3 text-lg text-neutral-600 font-medium">
            Sign in to your account
          </p>
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Angkor Holiday Hotel Logo" className="h-16 w-auto mb-2 rounded-lg shadow" />
          <h2 className="text-2xl font-bold text-primary">Welcome to Angkor Holiday Hotel POS</h2>
        </div>

        <div className="card-gradient p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="profile" size="sm" className="text-neutral-400" />
                  </div>
                  <input
                    {...register('username')}
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    className={`input pl-10 ${errors.username ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500' : ''}`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="form-error">{errors.username.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="eye" size="sm" className="text-neutral-400" />
                  </div>
                  <input
                    {...register('password')}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className={`input pl-10 ${errors.password ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500' : ''}`}
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center py-4 text-lg font-semibold"
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <Icon name="check" size="sm" className="mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-4 border border-neutral-200/50">
                <p className="text-sm font-semibold text-neutral-700 mb-2">
                  Demo Credentials
                </p>
                <div className="space-y-1 text-xs text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Admin:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">admin / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cashier:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">cashier / cashier123</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '400ms' }}>
          <p className="text-sm text-neutral-500">
            Secure restaurant management system
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 