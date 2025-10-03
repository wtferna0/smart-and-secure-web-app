import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    console.warn('useCart used outside CartProvider');
    // Return safe fallback
    return {
      cartItems: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getCartTotal: () => 0,
      getCartItemsCount: () => 0,
      getItemQuantity: () => 0,
      isItemInCart: () => false,
      getAvailableQuantity: () => 0,
      cartTotal: 0,
      itemsCount: 0,
      isEmpty: true,
      isOpen: false,
      setOpen: () => {}
    };
  }
  return context;
}

export function CartProvider({ children }) {

  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // SAFE array access - always returns array
  const getSafeItems = (items) => {
    return Array.isArray(items) ? items : [];
  };

  const addToCart = (item) => {
    if (!item || !item.id) {
      console.warn('Attempted to add invalid item to cart:', item);
      return;
    }

    setCartItems(prev => {
      const safePrev = getSafeItems(prev);
      const existing = safePrev.find(cartItem => cartItem.id === item.id);
      
      if (existing) {
        return safePrev.map(cartItem =>
          cartItem.id === item.id
            ? { 
                ...cartItem, 
                quantity: (cartItem.quantity || 0) + 1 
              }
            : cartItem
        );
      }
      
      return [...safePrev, { 
        id: item.id,
        name: item.name || 'Unknown Item',
        price: parseFloat(item.price) || 0,
        quantity: 1,
        category: item.category,
        stock_qty: item.stock_qty || 0,
        image: item.image || null // Add image to cart item
      }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const safePrev = getSafeItems(prev);
      return safePrev.filter(item => item.id !== itemId);
    });
  };

  const updateQuantity = (itemId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    if (numQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prev => {
      const safePrev = getSafeItems(prev);
      return safePrev.map(item =>
        item.id === itemId ? { ...item, quantity: numQuantity } : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    const safeItems = getSafeItems(cartItems);
    return safeItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    const safeItems = getSafeItems(cartItems);
    return safeItems.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
  };

  const getItemQuantity = (itemId) => {
    const safeItems = getSafeItems(cartItems);
    const item = safeItems.find(cartItem => cartItem.id === itemId);
    return item ? (parseInt(item.quantity) || 0) : 0;
  };

  const isItemInCart = (itemId) => {
    const safeItems = getSafeItems(cartItems);
    return safeItems.some(item => item.id === itemId);
  };

  const getAvailableQuantity = (item) => {
    if (!item) return 0;
    const currentInCart = getItemQuantity(item.id);
    const stock = parseInt(item.stock_qty) || 0;
    return Math.max(0, stock - currentInCart);
  };

  React.useEffect(() => {
    window.debugCart = () => {
      console.log('🛒 Cart Items:', cartItems);
      console.log('🛒 Cart Total:', getCartTotal());
      return { items: cartItems, total: getCartTotal() };
    };
  }, [cartItems]);

  // SAFE computed values
  const safeCartItems = getSafeItems(cartItems);
  const cartTotal = getCartTotal();
  const itemsCount = getCartItemsCount();
  const isEmpty = safeCartItems.length === 0;

  const value = {
    // State (always safe)
    cartItems: safeCartItems,
    isOpen,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setOpen: setIsOpen,
    
    // Getters
    getCartTotal,
    getCartItemsCount,
    getItemQuantity,
    isItemInCart,
    getAvailableQuantity,
    
    // Computed values (always safe)
    cartTotal,
    itemsCount,
    isEmpty
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;