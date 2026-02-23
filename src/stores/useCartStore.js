import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { showSuccess, showError } from '../utils/toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      // Cart items array
      items: [],

      // Add item to cart (allows backorder - quantity can exceed stock)
      addItem: (product, quantity = 1) => {
        const productId = product.product_id || product._id;

        if (quantity <= 0) {
          showError('Please select a quantity');
          return false;
        }

        const availableStock = product.total_quantity || 0;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.productId === productId
          );

          if (existingIndex >= 0) {
            // Update existing item quantity
            const updatedItems = [...state.items];
            const newQty = updatedItems[existingIndex].quantity + quantity;

            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: newQty,
              isBackorder: newQty > availableStock,
            };

            // Show backorder warning if exceeds stock
            if (newQty > availableStock) {
              showSuccess(`Updated quantity. Note: ${newQty - availableStock} units will be on backorder`);
            } else {
              showSuccess(`Updated ${product.product_name} quantity in cart`);
            }
            return { items: updatedItems };
          }

          // Add new item
          const isBackorder = quantity > availableStock;
          const newItem = {
            id: Date.now(), // unique cart item id
            productId,
            product_name: product.product_name,
            part_number: product.part_number,
            image: product.image?.url || null,
            quantity,
            total_quantity: availableStock,
            category: product.category,
            brand: product.brand,
            isBackorder,
          };

          if (isBackorder) {
            showSuccess(`Added to cart. Note: ${quantity - availableStock} units will be on backorder`);
          } else {
            showSuccess(`Added ${product.product_name} to cart`);
          }
          return { items: [...state.items, newItem] };
        });

        return true;
      },

      // Update item quantity (allows backorder)
      updateQuantity: (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;

        set((state) => {
          return {
            items: state.items.map((item) =>
              item.id === cartItemId
                ? {
                    ...item,
                    quantity: newQuantity,
                    isBackorder: newQuantity > item.total_quantity,
                  }
                : item
            ),
          };
        });
      },

      // Increment quantity (allows backorder)
      incrementQuantity: (cartItemId) => {
        set((state) => {
          return {
            items: state.items.map((item) =>
              item.id === cartItemId
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    isBackorder: item.quantity + 1 > item.total_quantity,
                  }
                : item
            ),
          };
        });
      },

      // Decrement quantity
      decrementQuantity: (cartItemId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
        }));
      },

      // Remove item from cart
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
        showSuccess('Item removed from cart');
      },

      // Clear entire cart
      clearCart: () => {
        set({ items: [] });
        showSuccess('Cart cleared');
      },

      // Get cart item count
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Get total unique items
      getUniqueItemCount: () => {
        return get().items.length;
      },

      // Check if product is in cart
      isInCart: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },

      // Get item quantity in cart
      getItemQuantity: (productId) => {
        const item = get().items.find((item) => item.productId === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'kb-cart-storage', // localStorage key
      version: 1,
    }
  )
);

export default useCartStore;
