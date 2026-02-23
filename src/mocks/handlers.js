import { http, HttpResponse } from 'msw';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Mock data
const mockProducts = [
  {
    _id: '1',
    product_id: 'PRD-00001',
    part_number: 'MS20426AD3-4',
    product_name: 'Solid Rivet MS20426AD3-4',
    category: 'Rivets',
    brand: 'Aviation Standard',
    list_price: 0.50,
    your_price: 0.35,
    total_quantity: 1000,
    stock_status: 'In Stock',
    is_active: true
  },
  {
    _id: '2',
    product_id: 'PRD-00002',
    part_number: 'AN470AD3-5',
    product_name: 'Universal Head Rivet',
    category: 'Rivets',
    brand: 'Standard Parts',
    list_price: 0.45,
    your_price: 0.30,
    total_quantity: 25,
    stock_status: 'Low Stock',
    is_active: true
  }
];

const mockUser = {
  _id: 'user1',
  user_id: 'USR-00001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'BUYER',
  company_name: 'Test Company'
};

// API Handlers
export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@example.com' && body.password === 'Password@123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token'
        }
      });
    }

    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: { user: mockUser }
    });
  }),

  // Products endpoints
  http.get(`${API_URL}/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    return HttpResponse.json({
      success: true,
      data: {
        products: mockProducts,
        pagination: {
          page,
          limit,
          total: mockProducts.length,
          totalPages: 1
        }
      }
    });
  }),

  http.get(`${API_URL}/products/:id`, ({ params }) => {
    const product = mockProducts.find(p => p._id === params.id || p.product_id === params.id);

    if (product) {
      return HttpResponse.json({
        success: true,
        data: product
      });
    }

    return HttpResponse.json(
      { success: false, message: 'Product not found' },
      { status: 404 }
    );
  }),

  http.post(`${API_URL}/products`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'new-id',
        product_id: 'PRD-NEW',
        ...body
      }
    }, { status: 201 });
  }),

  http.delete(`${API_URL}/products/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  }),

  // Orders endpoints
  http.get(`${API_URL}/orders`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        orders: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
    });
  }),

  // Dashboard endpoints
  http.get(`${API_URL}/dashboard/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalProducts: mockProducts.length,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0
      }
    });
  })
];
