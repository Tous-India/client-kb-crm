import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import authService from '../../services/auth.service';
import apiClient from '../../services/api/client';

// Mock apiClient
vi.mock('../../services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock USE_MOCK_DATA to false so we test actual API calls
vi.mock('../../services/api/config', () => ({
  USE_MOCK_DATA: false,
  API_CONFIG: {
    BASE_URL: 'http://localhost:5000/api',
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { _id: '123', name: 'Test User', email: 'test@test.com', role: 'BUYER' },
            token: 'jwt_token_123',
          },
        },
      };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@test.com');
      expect(localStorage.getItem('authToken')).toBe('jwt_token_123');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockResponse.data.data.user);
    });

    it('should handle login error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      const result = await authService.login('test@test.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should handle network error', async () => {
      apiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.login('test@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: 'BUYER',
      };
      const mockResponse = {
        data: {
          data: {
            user: { _id: '456', ...userData },
          },
        },
      };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('new@test.com');
    });

    it('should handle registration error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Email already exists' } },
      });

      const result = await authService.register({ email: 'existing@test.com' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = { _id: '123', name: 'Test User', email: 'test@test.com' };
      apiClient.get.mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockUser);
    });

    it('should handle error when not authenticated', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Not authenticated' } },
      });

      const result = await authService.getCurrentUser();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('logout', () => {
    it('should logout and clear localStorage', async () => {
      localStorage.setItem('authToken', 'test_token');
      localStorage.setItem('user', JSON.stringify({ name: 'Test' }));
      apiClient.post.mockResolvedValue({});

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should still clear localStorage on logout error', async () => {
      localStorage.setItem('authToken', 'test_token');
      apiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('authToken', 'test_token');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when exists', () => {
      localStorage.setItem('authToken', 'test_token');

      expect(authService.getToken()).toBe('test_token');
    });

    it('should return null when no token', () => {
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return user when exists', () => {
      const user = { _id: '123', name: 'Test User' };
      localStorage.setItem('user', JSON.stringify(user));

      expect(authService.getUser()).toEqual(user);
    });

    it('should return null when no user', () => {
      expect(authService.getUser()).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return true for SUPER_ADMIN', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'SUPER_ADMIN' }));

      expect(authService.hasPermission('any_permission')).toBe(true);
    });

    it('should return true when user has permission', () => {
      localStorage.setItem('user', JSON.stringify({
        role: 'SUB_ADMIN',
        permissions: ['manage_users', 'manage_products'],
      }));

      expect(authService.hasPermission('manage_users')).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      localStorage.setItem('user', JSON.stringify({
        role: 'SUB_ADMIN',
        permissions: ['manage_products'],
      }));

      expect(authService.hasPermission('manage_users')).toBe(false);
    });

    it('should return false when no user', () => {
      expect(authService.hasPermission('any_permission')).toBe(false);
    });
  });
});
