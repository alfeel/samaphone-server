import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ELIGIBLE_ROLES_FOR_SPECIAL_PRICE } from '../lib/constants';

export interface CartItem {
  id: string;
  nameAr: string;
  price: number;
  specialPrice?: number;
  imageUri?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: ReactNode }) {
  const { userData } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('samaphone_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('samaphone_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any) => {
    setItems((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        nameAr: product.nameAr,
        price: product.price,
        specialPrice: product.specialPrice,
        imageUri: product.imageUri,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const isEligibleForSpecialPrice = userData?.role && ELIGIBLE_ROLES_FOR_SPECIAL_PRICE.includes(userData.role);

  const totalPrice = items.reduce((sum, item) => {
    const itemPrice = isEligibleForSpecialPrice && item.specialPrice ? item.specialPrice : item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}
