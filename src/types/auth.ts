export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}