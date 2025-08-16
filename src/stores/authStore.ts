import { create } from 'zustand';

interface MockUser {
  id: string;
  email: string;
}

interface AuthState {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  email: 'admin@fintonico.com'
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    console.log('SignIn attempt:', { email, password });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock auth - accept admin/admin or any email format
    if (email === 'admin' && password === 'admin') {
      console.log('Admin login successful');
      set({ user: MOCK_USER });
      localStorage.setItem('fintonico-user', JSON.stringify(MOCK_USER));
      return;
    }
    
    if (email.includes('@') && password.length >= 1) {
      console.log('Email login successful');
      set({ user: MOCK_USER });
      localStorage.setItem('fintonico-user', JSON.stringify(MOCK_USER));
      return;
    }
    
    console.log('Login failed');
    throw new Error('Invalid credentials. Try admin/admin or any email.');
  },

  signUp: async () => {
    // Mock signup - just log them in
    set({ user: MOCK_USER });
    localStorage.setItem('fintonico-user', JSON.stringify(MOCK_USER));
  },

  signOut: async () => {
    set({ user: null });
    localStorage.removeItem('fintonico-user');
    localStorage.removeItem('fintonico-expenses');
  },

  checkUser: async () => {
    set({ loading: true });
    
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('fintonico-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        set({ user, loading: false });
        return;
      } catch {
        localStorage.removeItem('fintonico-user');
      }
    }
    
    set({ user: null, loading: false });
  },
}));