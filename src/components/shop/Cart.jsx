import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';

const Cart = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // TODO: Load cart items from context or localStorage
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    // Mock data for now - replace with actual cart logic
    const mockCart = [
      {
        id: '1',
        name: 'Sample Product 1',
        price: 29.99,
        quantity: 2,
        imageUrl: '/placeholder-product.jpg'
      },
      {
        id: '2',
        name: 'Sample Product 2',
        price: 49.99,
        quantity: 1,
        imageUrl: '/placeholder-product.jpg'
      }
    ];
    setCartItems(mockCart);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Shopping Cart</h3>
          <button className="close-cart" onClick={onClose}>×</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <Link to="/market" className="shop-now-btn" onClick={onClose}>
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>

                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-price">${item.price.toFixed(2)}</p>
                  </div>

                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <FaMinus />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total ({getTotalItems()} items):</span>
                <span className="total-price">${getTotalPrice().toFixed(2)}</span>
              </div>

              <Link to="/checkout" className="checkout-btn" onClick={onClose}>
                Checkout
              </Link>

              <Link to="/cart" className="view-cart-btn" onClick={onClose}>
                View Full Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
