import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PcBuild } from '@shared/schema';

export interface CartItem {
  build: PcBuild;
  quantity: number;
  addedAt: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (build: PcBuild, quantity?: number) => void;
  removeFromCart: (buildId: number) => void;
  updateQuantity: (buildId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalWithGST: () => number;
  getGSTAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addToCart: (build: PcBuild, quantity = 1) => {
        // Validate inputs
        if (!build || !build.id || quantity <= 0) {
          if (import.meta.env.DEV) {
            console.warn('Invalid build or quantity provided to addToCart');
          }
          return;
        }
        
        // Prevent adding more than 10 of the same item
        const currentQuantity = get().items.find(item => item.build.id === build.id)?.quantity || 0;
        if (currentQuantity + quantity > 10) {
          if (import.meta.env.DEV) {
            console.warn('Cannot add more than 10 of the same item to cart');
          }
          return;
        }
        
        set((state) => {
          const existingItem = state.items.find(item => item.build.id === build.id);
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.build.id === build.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, 10) }
                  : item
              )
            };
          }
          
          return {
            items: [...state.items, {
              build,
              quantity: Math.min(quantity, 10),
              addedAt: new Date().toISOString()
            }]
          };
        });
      },
      
      removeFromCart: (buildId: number) => {
        set((state) => ({
          items: state.items.filter(item => item.build.id !== buildId)
        }));
      },
      
      updateQuantity: (buildId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(buildId);
          return;
        }
        
        // Cap quantity at 10
        const finalQuantity = Math.min(Math.max(1, quantity), 10);
        
        set((state) => ({
          items: state.items.map(item =>
            item.build.id === buildId
              ? { ...item, quantity: finalQuantity }
              : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      openCart: () => {
        set({ isOpen: true });
      },
      
      closeCart: () => {
        set({ isOpen: false });
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          try {
            const basePrice = item.build.basePrice;
            if (!basePrice || typeof basePrice !== 'number' || basePrice <= 0) {
              if (import.meta.env.DEV) {
                console.warn('Invalid base price:', basePrice);
              }
              return total;
            }
            
            return total + (basePrice * item.quantity);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Error calculating price for item:', item, error);
            }
            return total;
          }
        }, 0);
      },
      
      getTotalWithGST: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.build.basePrice;
          if (!basePrice || typeof basePrice !== 'number' || basePrice <= 0) {
            return total;
          }
          
          const finalAmount = Math.round(basePrice * 1.18); // 18% GST
          return total + (finalAmount * item.quantity);
        }, 0);
      },
      
      getGSTAmount: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.build.basePrice;
          if (!basePrice || typeof basePrice !== 'number' || basePrice <= 0) {
            return total;
          }
          
          const gstAmount = Math.round(basePrice * 0.18); // 18% GST
          return total + (gstAmount * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'fusionforge-cart-storage',
    }
  )
);