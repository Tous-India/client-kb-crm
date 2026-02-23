import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Users Store
 * Manages users UI state using Zustand
 */
const useUsersStore = create(
  devtools(
    (set, get) => ({
      // Filter state
      searchTerm: '',
      roleFilter: 'all',
      statusFilter: 'all',

      // Sort state
      sortBy: 'user_id',
      sortOrder: 'asc',

      // Pagination state
      page: 0,
      rowsPerPage: 10,

      // Selected user for view/edit/delete
      selectedUser: null,

      // Modal states
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      isDetailsModalOpen: false,

      // Details modal tab
      detailsTab: 0,

      // Form state
      userForm: {
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'BUYER',
        address: {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'USA',
        },
        company_details: {
          company_name: '',
          tax_id: '',
          phone: '',
          billing_email: '',
        },
      },

      // Profile image state
      profileImagePreview: null,
      profileImageFile: null,

      // Actions - Filters
      setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
      setRoleFilter: (roleFilter) => set({ roleFilter, page: 0 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),

      clearFilters: () => set({
        searchTerm: '',
        roleFilter: 'all',
        statusFilter: 'all',
        page: 0,
      }),

      // Actions - Sort
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      handleSort: (column) => {
        const { sortBy, sortOrder } = get();
        if (sortBy === column) {
          set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
        } else {
          set({ sortBy: column, sortOrder: 'asc' });
        }
      },

      // Actions - Pagination
      setPage: (page) => set({ page }),
      setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),

      // Actions - User selection
      setSelectedUser: (selectedUser) => set({ selectedUser }),
      clearSelectedUser: () => set({ selectedUser: null }),

      // Actions - Form
      setUserForm: (userForm) => set({ userForm }),
      updateUserForm: (field, value) => set((state) => ({
        userForm: { ...state.userForm, [field]: value }
      })),
      updateUserFormNested: (parent, field, value) => set((state) => ({
        userForm: {
          ...state.userForm,
          [parent]: { ...state.userForm[parent], [field]: value }
        }
      })),
      resetUserForm: () => set({
        userForm: {
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'BUYER',
          address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: 'USA',
          },
          company_details: {
            company_name: '',
            tax_id: '',
            phone: '',
            billing_email: '',
          },
        },
        profileImagePreview: null,
        profileImageFile: null,
      }),

      // Actions - Profile Image
      setProfileImagePreview: (profileImagePreview) => set({ profileImagePreview }),
      setProfileImageFile: (profileImageFile) => set({ profileImageFile }),
      clearProfileImage: () => set({ profileImagePreview: null, profileImageFile: null }),

      // Actions - Modals
      openAddModal: () => {
        get().resetUserForm();
        set({ isAddModalOpen: true });
      },
      closeAddModal: () => set({
        isAddModalOpen: false,
        profileImagePreview: null,
        profileImageFile: null,
      }),

      openEditModal: (user) => {
        set({
          isEditModalOpen: true,
          selectedUser: user,
          userForm: {
            name: user.name || '',
            email: user.email || '',
            password: '',
            phone: user.phone || '',
            role: user.role || 'BUYER',
            address: {
              street: user.address?.street || '',
              city: user.address?.city || '',
              state: user.address?.state || '',
              zip: user.address?.zip || '',
              country: user.address?.country || 'USA',
            },
            company_details: {
              company_name: user.company_details?.company_name || '',
              tax_id: user.company_details?.tax_id || '',
              phone: user.company_details?.phone || '',
              billing_email: user.company_details?.billing_email || '',
            },
          },
          profileImagePreview: user.profile_image || null,
        });
      },
      closeEditModal: () => set({
        isEditModalOpen: false,
        selectedUser: null,
        profileImagePreview: null,
        profileImageFile: null,
      }),

      openDeleteModal: (user) => set({
        isDeleteModalOpen: true,
        selectedUser: user,
      }),
      closeDeleteModal: () => set({
        isDeleteModalOpen: false,
        selectedUser: null,
      }),

      openDetailsModal: (user) => set({
        isDetailsModalOpen: true,
        selectedUser: user,
        detailsTab: 0,
      }),
      closeDetailsModal: () => set({
        isDetailsModalOpen: false,
        selectedUser: null,
        detailsTab: 0,
      }),

      setDetailsTab: (detailsTab) => set({ detailsTab }),

      // Computed - Get filtered users (to be used with react-query data)
      getFilteredUsers: (users = []) => {
        const { searchTerm, roleFilter, statusFilter } = get();

        return users.filter((user) => {
          // Role filter
          const matchesRole = roleFilter === 'all' || user.role === roleFilter;

          // Status filter
          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active !== false) ||
            (statusFilter === 'inactive' && user.is_active === false);

          // Search filter
          const matchesSearch =
            searchTerm === '' ||
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.user_id && user.user_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.company_details?.company_name && user.company_details.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

          return matchesRole && matchesStatus && matchesSearch;
        });
      },

      // Computed - Get sorted users
      getSortedUsers: (users = []) => {
        const { sortBy, sortOrder } = get();
        const filteredUsers = get().getFilteredUsers(users);

        return [...filteredUsers].sort((a, b) => {
          let compareA, compareB;

          switch (sortBy) {
            case 'name':
              compareA = a.name || '';
              compareB = b.name || '';
              break;
            case 'email':
              compareA = a.email || '';
              compareB = b.email || '';
              break;
            case 'role':
              compareA = a.role || '';
              compareB = b.role || '';
              break;
            case 'user_id':
            default:
              compareA = a.user_id || '';
              compareB = b.user_id || '';
              break;
          }

          if (sortOrder === 'asc') {
            return compareA > compareB ? 1 : -1;
          } else {
            return compareA < compareB ? 1 : -1;
          }
        });
      },

      // Computed - Get paginated users
      getPaginatedUsers: (users = []) => {
        const { page, rowsPerPage } = get();
        const sortedUsers = get().getSortedUsers(users);
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedUsers.slice(startIndex, endIndex);
      },

      // Computed - Get stats
      getStats: (users = []) => {
        const admins = users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'SUB_ADMIN');
        const buyers = users.filter((u) => u.role === 'BUYER');
        const activeUsers = users.filter((u) => u.is_active !== false);
        const inactiveUsers = users.filter((u) => u.is_active === false);

        return {
          total: users.length,
          admins: admins.length,
          buyers: buyers.length,
          active: activeUsers.length,
          inactive: inactiveUsers.length,
        };
      },
    }),
    { name: 'users-store' }
  )
);

export default useUsersStore;
