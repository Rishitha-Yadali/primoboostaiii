import { User, LoginCredentials, SignupCredentials, ForgotPasswordData } from '../types/auth';
import { supabase } from '../lib/supabaseClient';
import { deviceTrackingService } from './deviceTrackingService';

class AuthService {
  private isValidGmail(email: string): boolean {
    const gmailRegex = /^[^\s@]+@gmail\.com$/;
    return gmailRegex.test(email);
  }

  private validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long' };
    if (!/(?=.*[a-z])/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/(?=.*[A-Z])/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/(?=.*\d)/.test(password)) return { isValid: false, message: 'Password must contain at least one number' };
    if (!/(?=.*[@$!%*?&])/.test(password)) return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    return { isValid: true };
  }

  async login(credentials: LoginCredentials): Promise<User> {
    if (!this.isValidGmail(credentials.email)) throw new Error('Please enter a valid Gmail address (@gmail.com)');
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: credentials.email, 
      password: credentials.password 
    });
    
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed. Please try again.');

    localStorage.setItem('loginTimestamp', Date.now().toString());

    // Register device and create session for tracking
    try {
      const deviceId = await deviceTrackingService.registerDevice(data.user.id);
      if (deviceId && data.session) {
        await deviceTrackingService.createSession(data.user.id, deviceId, data.session.access_token);
        await deviceTrackingService.logActivity(data.user.id, 'login', {
          loginMethod: 'email_password',
          success: true
        }, deviceId);
      }
    } catch (deviceError) {
      console.warn('Device tracking failed:', deviceError);
      // Don't fail login if device tracking fails
    }

    const profile = await this.getUserProfile(data.user.id).catch(() => null);
    return {
      id: data.user.id,
      name: profile?.full_name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email!,
      isVerified: data.user.email_confirmed_at !== null,
      createdAt: data.user.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }

  async signup(credentials: SignupCredentials): Promise<{ needsVerification: boolean; email: string }> {
    if (!credentials.name.trim()) throw new Error('Full name is required');
    if (credentials.name.trim().length < 2) throw new Error('Name must be at least 2 characters long');
    if (!/^[a-zA-Z\s]+$/.test(credentials.name.trim())) throw new Error('Name can only contain letters and spaces');
    if (!credentials.email) throw new Error('Gmail address is required');
    if (!this.isValidGmail(credentials.email)) throw new Error('Please enter a valid Gmail address (@gmail.com)');

    const passwordValidation = this.validatePasswordStrength(credentials.password);
    if (!passwordValidation.isValid) throw new Error(passwordValidation.message!);
    if (credentials.password !== credentials.confirmPassword) throw new Error('Passwords do not match');

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: { data: { name: credentials.name.trim() } }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Failed to create account. Please try again.');

    localStorage.setItem('loginTimestamp', Date.now().toString());

    // Register device for new user
    try {
      const deviceId = await deviceTrackingService.registerDevice(data.user.id);
      if (deviceId) {
        await deviceTrackingService.logActivity(data.user.id, 'signup', {
          signupMethod: 'email_password',
          success: true
        }, deviceId);
      }
    } catch (deviceError) {
      console.warn('Device tracking failed during signup:', deviceError);
    }

    return {
      needsVerification: !data.session,
      email: credentials.email
    };
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Check login timestamp for auto-logout
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      if (loginTimestamp && Date.now() - parseInt(loginTimestamp) > 24 * 60 * 60 * 1000) {
        await this.logout();
        localStorage.removeItem('loginTimestamp');
        return null;
      }

      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );
      
      let sessionData;
      try {
        sessionData = await Promise.race([sessionPromise, timeoutPromise]) as any;
      } catch (timeoutError) {
        console.warn('Session check timed out, user might be offline');
        return null;
      }

      const { data: { session }, error } = sessionData;
      if (error) {
        console.error('Session error:', error);
        return null;
      }
      
      if (!session?.user) return null;

      // Validate session is not expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('Session expired, attempting refresh...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            console.error('Session refresh failed:', refreshError);
            return null;
          }
          // Use refreshed session
          const refreshedSession = refreshData.session;
          const profile = await this.getUserProfile(refreshedSession.user.id).catch(() => null);
          return {
            id: refreshedSession.user.id,
            name: profile?.full_name || refreshedSession.user.email?.split('@')[0] || 'User',
            email: refreshedSession.user.email!,
            isVerified: refreshedSession.user.email_confirmed_at !== null,
            createdAt: refreshedSession.user.created_at || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
        } catch (refreshError) {
          console.error('Failed to refresh expired session:', refreshError);
          return null;
        }
      }

      // Update device activity for current session
      try {
        const deviceId = await deviceTrackingService.registerDevice(session.user.id);
        if (deviceId) {
          await deviceTrackingService.logActivity(session.user.id, 'session_activity', {
            action: 'session_check',
            timestamp: new Date().toISOString()
          }, deviceId);
        }
      } catch (deviceError) {
        console.warn('Device activity update failed:', deviceError);
      }

      const profile = await this.getUserProfile(session.user.id).catch(() => null);
      return {
        id: session.user.id,
        name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email!,
        isVerified: session.user.email_confirmed_at !== null,
        createdAt: session.user.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    // Log logout activity before ending session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const deviceId = await deviceTrackingService.registerDevice(session.user.id);
        if (deviceId) {
          await deviceTrackingService.logActivity(session.user.id, 'logout', {
            logoutMethod: 'manual',
            timestamp: new Date().toISOString()
          }, deviceId);
          
          // End current session
          await deviceTrackingService.endSession(session.access_token, 'logout');
        }
      }
    } catch (error) {
      console.warn('Failed to log logout activity:', error);
    }

    localStorage.removeItem('loginTimestamp');
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('Failed to sign out. Please try again.');
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    if (!this.isValidGmail(data.email)) throw new Error('Please enter a valid Gmail address (@gmail.com)');
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw new Error(error.message);
  }

  async resetPassword(newPassword: string): Promise<void> {
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) throw new Error(passwordValidation.message!);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  private async getUserProfile(userId: string): Promise<{ full_name: string } | null> {
    try {
      const { data, error } = await supabase.from('user_profiles').select('full_name').eq('id', userId).maybeSingle();
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Helper method to ensure session is valid before long operations
  async ensureValidSession(): Promise<boolean> {
    try {
      // First check if we have a current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check failed:', error);
        return false;
      }

      if (!session) {
        console.log('No active session found');
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + 300) { // Refresh if expires in 5 minutes
        console.log('Session expiring soon, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          return false;
        }
        console.log('✅ Session refreshed successfully');
      }

      return true;
    } catch (error) {
      console.error('Failed to ensure valid session:', error);
      return false;
    }
  }

  // Get user's device management data
  async getUserDevices(userId: string) {
    return deviceTrackingService.getUserDevices(userId);
  }

  async getUserSessions(userId: string) {
    return deviceTrackingService.getUserSessions(userId);
  }

  async getUserActivityLogs(userId: string, limit?: number) {
    return deviceTrackingService.getUserActivityLogs(userId, limit);
  }

  // Device management methods
  async trustDevice(deviceId: string) {
    return deviceTrackingService.trustDevice(deviceId);
  }

  async removeDevice(deviceId: string) {
    return deviceTrackingService.removeDevice(deviceId);
  }

  async endSession(sessionId: string) {
    return deviceTrackingService.endSpecificSession(sessionId);
  }

  async endAllOtherSessions(userId: string, currentSessionToken: string) {
    return deviceTrackingService.endAllOtherSessions(userId, currentSessionToken);
  }
}

export const authService = new AuthService();