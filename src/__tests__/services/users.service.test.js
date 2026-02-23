import { describe, it, expect, vi, beforeEach } from 'vitest';
import usersService from '../../services/users.service';
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

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers = [
        { _id: '1', user_id: 'USR-00001', name: 'User 1', role: 'BUYER' },
        { _id: '2', user_id: 'ADM-00001', name: 'Admin 1', role: 'SUPER_ADMIN' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockUsers, pagination: { total: 2 } },
      });

      const result = await usersService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsers);
      expect(result.pagination.total).toBe(2);
    });

    it('should pass params to API', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [], pagination: {} },
      });

      await usersService.getAll({ role: 'BUYER', page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { role: 'BUYER', page: 1 } }
      );
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch users' } },
      });

      const result = await usersService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch users');
      expect(result.data).toEqual([]);
    });
  });

  describe('getByRole', () => {
    it('should fetch users by role', async () => {
      const mockUsers = [{ _id: '1', role: 'SUB_ADMIN' }];
      apiClient.get.mockResolvedValue({
        data: { data: mockUsers },
      });

      const result = await usersService.getByRole('SUB_ADMIN');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsers);
    });

    it('should use buyers endpoint for BUYER role', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: [] },
      });

      await usersService.getByRole('BUYER');

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/buyers'));
    });
  });

  describe('getBuyers', () => {
    it('should fetch buyers successfully', async () => {
      const mockBuyers = [
        { _id: '1', name: 'Buyer 1', role: 'BUYER' },
        { _id: '2', name: 'Buyer 2', role: 'BUYER' },
      ];
      apiClient.get.mockResolvedValue({
        data: { data: mockBuyers },
      });

      const result = await usersService.getBuyers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBuyers);
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch buyers' } },
      });

      const result = await usersService.getBuyers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch buyers');
    });
  });

  describe('getById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = { _id: '123', user_id: 'USR-00001', name: 'Test User' };
      apiClient.get.mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await usersService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should handle direct data response', async () => {
      const mockUser = { _id: '123', name: 'Test User' };
      apiClient.get.mockResolvedValue({
        data: { data: mockUser },
      });

      const result = await usersService.getById('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should handle not found error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: 'User not found' } },
      });

      const result = await usersService.getById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const userData = { name: 'New User', email: 'new@test.com', role: 'BUYER' };
      const mockUser = { _id: '123', user_id: 'USR-00001', ...userData };
      apiClient.post.mockResolvedValue({
        data: { data: mockUser },
      });

      const result = await usersService.create(userData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should handle create error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { message: 'Email already exists' } },
      });

      const result = await usersService.create({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { name: 'Updated Name' };
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', name: 'Updated Name' } },
      });

      const result = await usersService.update('123', updateData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
    });

    it('should handle update error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      const result = await usersService.update('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await usersService.delete('123');

      expect(result.success).toBe(true);
    });

    it('should handle delete error', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete user' } },
      });

      const result = await usersService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete user');
    });
  });

  describe('activate', () => {
    it('should activate user successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', is_active: true } },
      });

      const result = await usersService.activate('123');

      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(true);
    });

    it('should handle activate error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot activate' } },
      });

      const result = await usersService.activate('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot activate');
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      apiClient.put.mockResolvedValue({
        data: { data: { _id: '123', is_active: false } },
      });

      const result = await usersService.deactivate('123');

      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(false);
    });

    it('should handle deactivate error', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { message: 'Cannot deactivate' } },
      });

      const result = await usersService.deactivate('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot deactivate');
    });
  });
});
