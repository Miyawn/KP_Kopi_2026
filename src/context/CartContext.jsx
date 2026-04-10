import { createContext, useEffect, useState, useContext } from 'react';

const CartContext = createContext();
const CART_STORAGE_KEY = "cartItems"

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return []

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (menu) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === menu.id)

      if (existingItem) {
        if (existingItem.quantity >= menu.stock) {
          return prevItems
        }

        return prevItems.map((item) =>
          item.id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...prevItems, { ...menu, quantity: 1 }]
    })
  }

  const removeFromCart = (menuId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== menuId)
    );
  };

  const updateQuantity = (menuId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(menuId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === menuId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        getTotalItems,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
