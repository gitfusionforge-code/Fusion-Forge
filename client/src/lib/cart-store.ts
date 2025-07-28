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
            // Fixed base amounts before GST
            const getFixedBasePrice = (basePrice: number) => {
              if (!basePrice || typeof basePrice !== 'number' || basePrice <= 0) {
                if (import.meta.env.DEV) {
                  console.warn('Invalid base price:', basePrice);
                }
                return 0;
              }
              if (basePrice <= 9500) return 10000; // Student Essentials CPU Only
              if (basePrice <= 15000) return 15000; // Student Essentials Full Set
              if (basePrice <= 25000) return 25000; // Budget Creators CPU Only
              if (basePrice <= 30000) return 30000; // Budget Creators Full Set
              // For higher tiers, use original base price
              return basePrice;
            };
            
            return total + (getFixedBasePrice(item.build.basePrice) * item.quantity);
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
          let finalAmount = 0;
          
          if (basePrice <= 9500) finalAmount = 11800; // Student Essentials CPU Only: ₹10,000 + ₹1,800 GST = ₹11,800
          else if (basePrice <= 15000) finalAmount = Math.round(15000 * 1.18); // Student Essentials Full Set
          else if (basePrice <= 25000) finalAmount = Math.round(25000 * 1.18); // Budget Creators CPU Only
          else if (basePrice <= 30000) finalAmount = Math.round(30000 * 1.18); // Budget Creators Full Set
          else finalAmount = Math.round(basePrice * 1.18); // Higher tiers
          
          return total + (finalAmount * item.quantity);
        }, 0);
      },
      
      getGSTAmount: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.build.basePrice;
          let gstAmount = 0;
          
          if (basePrice <= 9500) gstAmount = 1800; // Student Essentials CPU Only: Fixed ₹1,800 GST (18% of ₹10,000)
          else if (basePrice <= 15000) gstAmount = Math.round(15000 * 0.18); // Student Essentials Full Set
          else if (basePrice <= 25000) gstAmount = Math.round(25000 * 0.18); // Budget Creators CPU Only
          else if (basePrice <= 30000) gstAmount = Math.round(30000 * 0.18); // Budget Creators Full Set
          else gstAmount = Math.round(basePrice * 0.18); // Higher tiers
          
          return total + (gstAmount * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'fusionforge-cart-storage',
    }
  )
);