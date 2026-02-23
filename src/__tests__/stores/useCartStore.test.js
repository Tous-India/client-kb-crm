import { describe, it, expect, beforeEach, vi } from 'vitest';
import useCartStore from '../../stores/useCartStore';

// Mock toast functions
vi.mock('../../utils/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn()
}));

// Mock product data
const mockProduct = {
  _id: '1',
  product_id: 'PRD-00001',
  part_number: 'MS20426AD3-4',
  product_name: 'Solid Rivet MS20426AD3-4',
  category: 'Rivets',
  brand: 'Aviation Standard',
  total_quantity: 100,
  image: { url: 'https://example.com/image.jpg' }
};

const mockProduct2 = {
  _id: '2',
  product_id: 'PRD-00002',
  part_number: 'AN470AD3-5',
  product_name: 'Universal Head Rivet',
  category: 'Rivets',
  brand: 'Standard Parts',
  total_quantity: 50
};

const mockOutOfStockProduct = {
  _id: '3',
  product_id: 'PRD-00003',
  part_number: 'NAS1149D0363N',
  product_name: 'Flat Washer',
  category: 'Spacers',
  brand: 'NAS Standard',
  total_quantity: 0
};

describe('useCartStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    vi.clearAllMocks();
  });

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const result = useCartStore.getState().addItem(mockProduct, 5);

      expect(result).toBe(true);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('PRD-00001');
      expect(items[0].quantity).toBe(5);
    });

    it('should update quantity if item already exists', () => {
      useCartStore.getState().addItem(mockProduct, 5);
      useCartStore.getState().addItem(mockProduct, 3);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(8);
    });

    it('should return false and not add item with zero quantity', () => {
      const result = useCartStore.getState().addItem(mockProduct, 0);

      expect(result).toBe(false);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should return false and not add item with negative quantity', () => {
      const result = useCartStore.getState().addItem(mockProduct, -5);

      expect(result).toBe(false);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should mark item as backorder if quantity exceeds stock', () => {
      useCartStore.getState().addItem(mockProduct, 150);

      const items = useCartStore.getState().items;
      expect(items[0].isBackorder).toBe(true);
    });

    it('should not mark as backorder if quantity is within stock', () => {
      useCartStore.getState().addItem(mockProduct, 50);

      const items = useCartStore.getState().items;
      expect(items[0].isBackorder).toBe(false);
    });

    it('should store product details correctly', () => {
      useCartStore.getState().addItem(mockProduct, 1);

      const items = useCartStore.getState().items;
      expect(items[0].product_name).toBe('Solid Rivet MS20426AD3-4');
      expect(items[0].part_number).toBe('MS20426AD3-4');
      expect(items[0].category).toBe('Rivets');
      expect(items[0].brand).toBe('Aviation Standard');
      expect(items[0].image).toBe('https://example.com/image.jpg');
    });

    it('should handle product without image', () => {
      useCartStore.getState().addItem(mockProduct2, 1);

      const items = useCartStore.getState().items;
      expect(items[0].image).toBeNull();
    });

    it('should use _id if product_id is not available', () => {
      const productWithoutProductId = {
        _id: 'mongo-id-123',
        product_name: 'Test Product',
        part_number: 'TEST-001',
        total_quantity: 10
      };

      useCartStore.getState().addItem(productWithoutProductId, 1);

      const items = useCartStore.getState().items;
      expect(items[0].productId).toBe('mongo-id-123');
    });

    it('should default quantity to 1 if not provided', () => {
      useCartStore.getState().addItem(mockProduct);

      const items = useCartStore.getState().items;
      expect(items[0].quantity).toBe(1);
    });

    it('should allow backorder for out of stock products', () => {
      useCartStore.getState().addItem(mockOutOfStockProduct, 5);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].isBackorder).toBe(true);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(() => {
      useCartStore.getState().addItem(mockProduct, 5);
    });

    it('should update item quantity', () => {
      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(cartItemId, 10);

      expect(useCartStore.getState().items[0].quantity).toBe(10);
    });

    it('should not update quantity to less than 1', () => {
      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(cartItemId, 0);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should mark as backorder when updating to exceed stock', () => {
      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(cartItemId, 150);

      expect(useCartStore.getState().items[0].isBackorder).toBe(true);
    });

    it('should remove backorder flag when updating to within stock', () => {
      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(cartItemId, 150);
      useCartStore.getState().updateQuantity(cartItemId, 50);

      expect(useCartStore.getState().items[0].isBackorder).toBe(false);
    });
  });

  describe('incrementQuantity', () => {
    beforeEach(() => {
      useCartStore.getState().addItem(mockProduct, 5);
    });

    it('should increment quantity by 1', () => {
      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().incrementQuantity(cartItemId);

      expect(useCartStore.getState().items[0].quantity).toBe(6);
    });

    it('should mark as backorder when incrementing past stock', () => {
      useCartStore.setState({
        items: [{
          ...useCartStore.getState().items[0],
          quantity: 100
        }]
      });

      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().incrementQuantity(cartItemId);

      expect(useCartStore.getState().items[0].isBackorder).toBe(true);
    });
  });

  describe('decrementQuantity', () => {
    beforeEach(() => {
      useCartStore.getState().addItem(mockProduct, 5);
    });

    it('should decrement quantity by 1', () => {
      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().decrementQuantity(cartItemId);

      expect(useCartStore.getState().items[0].quantity).toBe(4);
    });

    it('should not decrement below 1', () => {
      useCartStore.setState({
        items: [{
          ...useCartStore.getState().items[0],
          quantity: 1
        }]
      });

      const cartItemId = useCartStore.getState().items[0].id;
      useCartStore.getState().decrementQuantity(cartItemId);

      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove single item from cart', () => {
      // Add single item
      useCartStore.getState().addItem(mockProduct, 5);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);

      const cartItemId = items[0].id;
      useCartStore.getState().removeItem(cartItemId);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should only remove specified item by id', () => {
      // Add item and get its id
      useCartStore.getState().addItem(mockProduct, 5);
      const firstItem = useCartStore.getState().items[0];

      // Try to remove with a non-existing id - should not remove anything
      useCartStore.getState().removeItem(99999);

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].productId).toBe('PRD-00001');
    });

    it('should filter removes only matching id', () => {
      // Add single item
      useCartStore.getState().addItem(mockProduct, 10);
      const item = useCartStore.getState().items[0];

      // Remove it
      useCartStore.getState().removeItem(item.id);

      // Should be empty
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    beforeEach(() => {
      useCartStore.getState().addItem(mockProduct, 5);
      useCartStore.getState().addItem(mockProduct2, 3);
    });

    it('should remove all items from cart', () => {
      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('getItemCount', () => {
    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });

    it('should return total quantity of all items', () => {
      useCartStore.getState().addItem(mockProduct, 5);
      useCartStore.getState().addItem(mockProduct2, 3);

      expect(useCartStore.getState().getItemCount()).toBe(8);
    });
  });

  describe('getUniqueItemCount', () => {
    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getUniqueItemCount()).toBe(0);
    });

    it('should return number of unique items', () => {
      useCartStore.getState().addItem(mockProduct, 5);
      useCartStore.getState().addItem(mockProduct2, 3);

      expect(useCartStore.getState().getUniqueItemCount()).toBe(2);
    });

    it('should not count duplicate items', () => {
      useCartStore.getState().addItem(mockProduct, 5);
      useCartStore.getState().addItem(mockProduct, 3); // Adding same product again

      expect(useCartStore.getState().getUniqueItemCount()).toBe(1);
    });
  });

  describe('isInCart', () => {
    beforeEach(() => {
      useCartStore.getState().addItem(mockProduct, 5);
    });

    it('should return true if product is in cart', () => {
      expect(useCartStore.getState().isInCart('PRD-00001')).toBe(true);
    });

    it('should return false if product is not in cart', () => {
      expect(useCartStore.getState().isInCart('PRD-99999')).toBe(false);
    });
  });

  describe('getItemQuantity', () => {
    beforeEach(() => {
      useCartStore.getState().addItem(mockProduct, 5);
    });

    it('should return quantity of item in cart', () => {
      expect(useCartStore.getState().getItemQuantity('PRD-00001')).toBe(5);
    });

    it('should return 0 if item is not in cart', () => {
      expect(useCartStore.getState().getItemQuantity('PRD-99999')).toBe(0);
    });
  });

  describe('Multiple Items', () => {
    it('should handle multiple items correctly', () => {
      useCartStore.getState().addItem(mockProduct, 10);
      useCartStore.getState().addItem(mockProduct2, 5);
      useCartStore.getState().addItem(mockOutOfStockProduct, 2);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(3);
      expect(useCartStore.getState().getItemCount()).toBe(17);
      expect(useCartStore.getState().getUniqueItemCount()).toBe(3);
    });

    it('should correctly identify backorder items', () => {
      useCartStore.getState().addItem(mockProduct, 50);
      useCartStore.getState().addItem(mockProduct2, 100); // Exceeds stock of 50
      useCartStore.getState().addItem(mockOutOfStockProduct, 5); // Out of stock

      const items = useCartStore.getState().items;
      expect(items[0].isBackorder).toBe(false);
      expect(items[1].isBackorder).toBe(true);
      expect(items[2].isBackorder).toBe(true);
    });
  });

  describe('Cart Item IDs', () => {
    it('should generate cart item IDs', () => {
      useCartStore.getState().addItem(mockProduct, 1);
      useCartStore.getState().addItem(mockProduct2, 1);

      const items = useCartStore.getState().items;
      // Each item should have an id
      expect(items[0].id).toBeDefined();
      expect(items[1].id).toBeDefined();
      expect(typeof items[0].id).toBe('number');
      expect(typeof items[1].id).toBe('number');
    });

    it('should have different product IDs for different items', () => {
      useCartStore.getState().addItem(mockProduct, 1);
      useCartStore.getState().addItem(mockProduct2, 1);

      const items = useCartStore.getState().items;
      expect(items[0].productId).not.toBe(items[1].productId);
    });
  });
});
