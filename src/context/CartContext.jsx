import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../components/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load giỏ hàng khi user đăng nhập
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadCart(user.uid);
      } else {
        setCart([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCart = async (userId) => {
    try {
      // Sửa từ 'carts' thành 'Carts' để khớp với Rules
      const cartRef = doc(db, 'Carts', userId);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        setCart(cartSnap.data().items || []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (userId, items) => {
    try {
      const cartRef = doc(db, 'Carts', userId);
      // Lưu thêm buyerId để đảm bảo Rules luôn pass
      await setDoc(cartRef, { 
        items, 
        buyerId: userId, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (error) {
      console.error('Error saving cart:', error);
      toast.error('Không thể lưu giỏ hàng');
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      return;
    }

    // KIỂM TRA TỒN KHO THẬT
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    let updatedCart = [...cart];

    if (existingItemIndex >= 0) {
      const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
      
      // Kiểm tra nếu cộng thêm có vượt quá kho không
      if (product.stock !== undefined && newQuantity > product.stock) {
        toast.error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
        return;
      }
      
      updatedCart[existingItemIndex].quantity = newQuantity;
    } else {
      updatedCart.push({ ...product, quantity });
    }

    setCart(updatedCart);
    await saveCart(user.uid, updatedCart);
  };

  const updateQuantity = async (productId, quantity) => {
    const user = auth.currentUser;
    if (!user) return;

    const item = cart.find(i => i.id === productId);
    if (item && item.stock !== undefined && quantity > item.stock) {
      toast.error('Vượt quá số lượng trong kho');
      return;
    }

    const updatedCart = quantity <= 0 
      ? cart.filter(item => item.id !== productId)
      : cart.map(item => item.id === productId ? { ...item, quantity } : item);

    setCart(updatedCart);
    await saveCart(user.uid, updatedCart);
  };

  // Các hàm khác giữ nguyên...
  const removeFromCart = async (productId) => {
    const user = auth.currentUser;
    if (!user) return;
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    await saveCart(user.uid, updatedCart);
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice: () => cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    getTotalItems: () => cart.reduce((total, item) => total + item.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};