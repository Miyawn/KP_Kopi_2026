import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (menu) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === menu.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...menu, quantity: 1 }];
    });
  };

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
