import { describe, it, expect, beforeEach } from 'vitest';
import useUsersStore from '../../stores/useUsersStore';

// Mock users data
const mockUsers = [
  {
    _id: '1',
    user_id: 'USR-00001',
    name: 'John Buyer',
    email: 'john@example.com',
    role: 'BUYER',
    is_active: true,
    company_details: { company_name: 'Acme Corp' }
  },
  {
    _id: '2',
    user_id: 'ADM-00001',
    name: 'Jane Admin',
    email: 'jane@example.com',
    role: 'SUPER_ADMIN',
    is_active: true
  },
  {
    _id: '3',
    user_id: 'USR-00002',
    name: 'Bob Inactive',
    email: 'bob@example.com',
    role: 'BUYER',
    is_active: false,
    company_details: { company_name: 'Beta Inc' }
  },
  {
    _id: '4',
    user_id: 'ADM-00002',
    name: 'Alice SubAdmin',
    email: 'alice@example.com',
    role: 'SUB_ADMIN',
    is_active: true
  }
];

describe('useUsersStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useUsersStore.setState({
      searchTerm: '',
      roleFilter: 'all',
      statusFilter: 'all',
      sortBy: 'user_id',
      sortOrder: 'asc',
      page: 0,
      rowsPerPage: 10,
      selectedUser: null,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      isDetailsModalOpen: false,
      detailsTab: 0,
      userForm: {
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'BUYER',
        address: { street: '', city: '', state: '', zip: '', country: 'USA' },
        company_details: { company_name: '', tax_id: '', phone: '', billing_email: '' }
      },
      profileImagePreview: null,
      profileImageFile: null
    });
  });

  describe('Filter Actions', () => {
    it('should set search term and reset page', () => {
      useUsersStore.setState({ page: 5 });
      useUsersStore.getState().setSearchTerm('john');

      const state = useUsersStore.getState();
      expect(state.searchTerm).toBe('john');
      expect(state.page).toBe(0);
    });

    it('should set role filter and reset page', () => {
      useUsersStore.setState({ page: 3 });
      useUsersStore.getState().setRoleFilter('BUYER');

      const state = useUsersStore.getState();
      expect(state.roleFilter).toBe('BUYER');
      expect(state.page).toBe(0);
    });

    it('should set status filter and reset page', () => {
      useUsersStore.setState({ page: 2 });
      useUsersStore.getState().setStatusFilter('active');

      const state = useUsersStore.getState();
      expect(state.statusFilter).toBe('active');
      expect(state.page).toBe(0);
    });

    it('should clear all filters', () => {
      useUsersStore.setState({
        searchTerm: 'test',
        roleFilter: 'BUYER',
        statusFilter: 'inactive',
        page: 5
      });

      useUsersStore.getState().clearFilters();

      const state = useUsersStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.roleFilter).toBe('all');
      expect(state.statusFilter).toBe('all');
      expect(state.page).toBe(0);
    });
  });

  describe('Sort Actions', () => {
    it('should set sort by', () => {
      useUsersStore.getState().setSortBy('name');
      expect(useUsersStore.getState().sortBy).toBe('name');
    });

    it('should set sort order', () => {
      useUsersStore.getState().setSortOrder('desc');
      expect(useUsersStore.getState().sortOrder).toBe('desc');
    });

    it('should toggle sort order when clicking same column', () => {
      useUsersStore.setState({ sortBy: 'name', sortOrder: 'asc' });
      useUsersStore.getState().handleSort('name');

      expect(useUsersStore.getState().sortOrder).toBe('desc');
    });

    it('should set new column and reset to asc', () => {
      useUsersStore.setState({ sortBy: 'name', sortOrder: 'desc' });
      useUsersStore.getState().handleSort('email');

      const state = useUsersStore.getState();
      expect(state.sortBy).toBe('email');
      expect(state.sortOrder).toBe('asc');
    });
  });

  describe('Pagination Actions', () => {
    it('should set page', () => {
      useUsersStore.getState().setPage(3);
      expect(useUsersStore.getState().page).toBe(3);
    });

    it('should set rows per page and reset page', () => {
      useUsersStore.setState({ page: 5 });
      useUsersStore.getState().setRowsPerPage(25);

      const state = useUsersStore.getState();
      expect(state.rowsPerPage).toBe(25);
      expect(state.page).toBe(0);
    });
  });

  describe('User Selection', () => {
    it('should set selected user', () => {
      const user = mockUsers[0];
      useUsersStore.getState().setSelectedUser(user);

      expect(useUsersStore.getState().selectedUser).toEqual(user);
    });

    it('should clear selected user', () => {
      useUsersStore.setState({ selectedUser: mockUsers[0] });
      useUsersStore.getState().clearSelectedUser();

      expect(useUsersStore.getState().selectedUser).toBeNull();
    });
  });

  describe('Form Actions', () => {
    it('should set user form', () => {
      const form = { name: 'Test', email: 'test@test.com' };
      useUsersStore.getState().setUserForm(form);

      expect(useUsersStore.getState().userForm).toEqual(form);
    });

    it('should update user form field', () => {
      useUsersStore.getState().updateUserForm('name', 'New Name');

      expect(useUsersStore.getState().userForm.name).toBe('New Name');
    });

    it('should update nested user form field', () => {
      useUsersStore.getState().updateUserFormNested('address', 'city', 'New York');

      expect(useUsersStore.getState().userForm.address.city).toBe('New York');
    });

    it('should reset user form', () => {
      useUsersStore.setState({
        userForm: { name: 'Test', email: 'test@test.com' },
        profileImagePreview: 'preview.jpg',
        profileImageFile: new File([], 'test.jpg')
      });

      useUsersStore.getState().resetUserForm();

      const state = useUsersStore.getState();
      expect(state.userForm.name).toBe('');
      expect(state.userForm.email).toBe('');
      expect(state.profileImagePreview).toBeNull();
      expect(state.profileImageFile).toBeNull();
    });
  });

  describe('Profile Image Actions', () => {
    it('should set profile image preview', () => {
      useUsersStore.getState().setProfileImagePreview('preview.jpg');
      expect(useUsersStore.getState().profileImagePreview).toBe('preview.jpg');
    });

    it('should set profile image file', () => {
      const file = new File([], 'test.jpg');
      useUsersStore.getState().setProfileImageFile(file);
      expect(useUsersStore.getState().profileImageFile).toBe(file);
    });

    it('should clear profile image', () => {
      useUsersStore.setState({
        profileImagePreview: 'preview.jpg',
        profileImageFile: new File([], 'test.jpg')
      });

      useUsersStore.getState().clearProfileImage();

      const state = useUsersStore.getState();
      expect(state.profileImagePreview).toBeNull();
      expect(state.profileImageFile).toBeNull();
    });
  });

  describe('Modal Actions', () => {
    it('should open and close add modal', () => {
      useUsersStore.getState().openAddModal();
      expect(useUsersStore.getState().isAddModalOpen).toBe(true);

      useUsersStore.getState().closeAddModal();
      expect(useUsersStore.getState().isAddModalOpen).toBe(false);
    });

    it('should open edit modal with user data', () => {
      const user = mockUsers[0];
      useUsersStore.getState().openEditModal(user);

      const state = useUsersStore.getState();
      expect(state.isEditModalOpen).toBe(true);
      expect(state.selectedUser).toEqual(user);
      expect(state.userForm.name).toBe(user.name);
      expect(state.userForm.email).toBe(user.email);
    });

    it('should close edit modal and clear selection', () => {
      useUsersStore.setState({
        isEditModalOpen: true,
        selectedUser: mockUsers[0]
      });

      useUsersStore.getState().closeEditModal();

      const state = useUsersStore.getState();
      expect(state.isEditModalOpen).toBe(false);
      expect(state.selectedUser).toBeNull();
    });

    it('should open and close delete modal', () => {
      const user = mockUsers[0];
      useUsersStore.getState().openDeleteModal(user);

      let state = useUsersStore.getState();
      expect(state.isDeleteModalOpen).toBe(true);
      expect(state.selectedUser).toEqual(user);

      useUsersStore.getState().closeDeleteModal();

      state = useUsersStore.getState();
      expect(state.isDeleteModalOpen).toBe(false);
      expect(state.selectedUser).toBeNull();
    });

    it('should open and close details modal', () => {
      const user = mockUsers[0];
      useUsersStore.getState().openDetailsModal(user);

      let state = useUsersStore.getState();
      expect(state.isDetailsModalOpen).toBe(true);
      expect(state.selectedUser).toEqual(user);
      expect(state.detailsTab).toBe(0);

      useUsersStore.getState().closeDetailsModal();

      state = useUsersStore.getState();
      expect(state.isDetailsModalOpen).toBe(false);
      expect(state.selectedUser).toBeNull();
    });

    it('should set details tab', () => {
      useUsersStore.getState().setDetailsTab(2);
      expect(useUsersStore.getState().detailsTab).toBe(2);
    });
  });

  describe('getFilteredUsers', () => {
    it('should return all users when no filters', () => {
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);
      expect(filtered).toHaveLength(4);
    });

    it('should filter by search term (name)', () => {
      useUsersStore.setState({ searchTerm: 'john' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('John Buyer');
    });

    it('should filter by search term (email)', () => {
      useUsersStore.setState({ searchTerm: 'alice@' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].email).toBe('alice@example.com');
    });

    it('should filter by search term (user_id)', () => {
      useUsersStore.setState({ searchTerm: 'USR-00001' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(1);
    });

    it('should filter by search term (company_name)', () => {
      useUsersStore.setState({ searchTerm: 'Acme' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].company_details.company_name).toBe('Acme Corp');
    });

    it('should filter by role', () => {
      useUsersStore.setState({ roleFilter: 'BUYER' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(u => u.role === 'BUYER')).toBe(true);
    });

    it('should filter by active status', () => {
      useUsersStore.setState({ statusFilter: 'active' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(3);
      expect(filtered.every(u => u.is_active !== false)).toBe(true);
    });

    it('should filter by inactive status', () => {
      useUsersStore.setState({ statusFilter: 'inactive' });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].is_active).toBe(false);
    });

    it('should combine multiple filters', () => {
      useUsersStore.setState({
        roleFilter: 'BUYER',
        statusFilter: 'active'
      });
      const filtered = useUsersStore.getState().getFilteredUsers(mockUsers);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('John Buyer');
    });

    it('should handle empty users array', () => {
      const filtered = useUsersStore.getState().getFilteredUsers([]);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getSortedUsers', () => {
    it('should sort by user_id ascending', () => {
      useUsersStore.setState({ sortBy: 'user_id', sortOrder: 'asc' });
      const sorted = useUsersStore.getState().getSortedUsers(mockUsers);

      expect(sorted[0].user_id).toBe('ADM-00001');
    });

    it('should sort by name descending', () => {
      useUsersStore.setState({ sortBy: 'name', sortOrder: 'desc' });
      const sorted = useUsersStore.getState().getSortedUsers(mockUsers);

      expect(sorted[0].name).toBe('John Buyer');
    });

    it('should sort by email', () => {
      useUsersStore.setState({ sortBy: 'email', sortOrder: 'asc' });
      const sorted = useUsersStore.getState().getSortedUsers(mockUsers);

      expect(sorted[0].email).toBe('alice@example.com');
    });

    it('should sort by role', () => {
      useUsersStore.setState({ sortBy: 'role', sortOrder: 'asc' });
      const sorted = useUsersStore.getState().getSortedUsers(mockUsers);

      expect(sorted[0].role).toBe('BUYER');
    });
  });

  describe('getPaginatedUsers', () => {
    it('should return paginated users', () => {
      useUsersStore.setState({ rowsPerPage: 2, page: 0 });
      const paginated = useUsersStore.getState().getPaginatedUsers(mockUsers);

      expect(paginated).toHaveLength(2);
    });

    it('should return correct page', () => {
      useUsersStore.setState({ rowsPerPage: 2, page: 1 });
      const paginated = useUsersStore.getState().getPaginatedUsers(mockUsers);

      expect(paginated).toHaveLength(2);
    });

    it('should return remaining items on last page', () => {
      useUsersStore.setState({ rowsPerPage: 3, page: 1 });
      const paginated = useUsersStore.getState().getPaginatedUsers(mockUsers);

      expect(paginated).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should calculate correct stats', () => {
      const stats = useUsersStore.getState().getStats(mockUsers);

      expect(stats.total).toBe(4);
      expect(stats.admins).toBe(2);
      expect(stats.buyers).toBe(2);
      expect(stats.active).toBe(3);
      expect(stats.inactive).toBe(1);
    });

    it('should handle empty users array', () => {
      const stats = useUsersStore.getState().getStats([]);

      expect(stats.total).toBe(0);
      expect(stats.admins).toBe(0);
      expect(stats.buyers).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.inactive).toBe(0);
    });
  });
});
