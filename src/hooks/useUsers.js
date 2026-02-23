import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersService from '../services/users.service';
import { showSuccess, showError } from '../utils/toast';

// Query keys
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), filters],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  byRole: (role) => [...userKeys.all, 'role', role],
  buyers: () => [...userKeys.all, 'buyers'],
};

/**
 * Hook to fetch all users
 * @param {Object} params - Query parameters
 * @returns {Object} React Query result
 */
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const result = await usersService.getAll(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      // Handle both { users: [...] } and direct array response
      return result.data?.users || result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch users by role
 * @param {string} role - User role (BUYER, SUPER_ADMIN, SUB_ADMIN)
 * @returns {Object} React Query result
 */
export const useUsersByRole = (role) => {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn: async () => {
      const result = await usersService.getByRole(role);
      if (!result.success) {
        throw new Error(result.error);
      }
      // Handle both { users: [...] } and direct array response
      return result.data?.users || result.data || [];
    },
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch buyer users
 * @returns {Object} React Query result
 */
export const useBuyers = () => {
  return useQuery({
    queryKey: userKeys.buyers(),
    queryFn: async () => {
      const result = await usersService.getBuyers();
      if (!result.success) {
        throw new Error(result.error);
      }
      // Handle both { users: [...] } and direct array response
      return result.data?.users || result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch a single user by ID
 * @param {string} id - User ID
 * @returns {Object} React Query result
 */
export const useUser = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const result = await usersService.getById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new user
 * @returns {Object} Mutation result
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const result = await usersService.create(userData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      showSuccess('User created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create user');
    },
  });
};

/**
 * Hook to update a user
 * @returns {Object} Mutation result
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await usersService.update(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      showSuccess('User updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update user');
    },
  });
};

/**
 * Hook to delete a user (soft delete - deactivate)
 * @returns {Object} Mutation result
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const result = await usersService.delete(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      showSuccess('User deactivated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to deactivate user');
    },
  });
};

/**
 * Hook to activate a user
 * @returns {Object} Mutation result
 */
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const result = await usersService.activate(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      showSuccess('User activated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to activate user');
    },
  });
};

/**
 * Hook to deactivate a user
 * @returns {Object} Mutation result
 */
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const result = await usersService.deactivate(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      showSuccess('User deactivated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to deactivate user');
    },
  });
};

export default useUsers;
