import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaCreditCard, FaTruck, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import { ThemeContext } from '../../context/ThemeContext';
import '../../style/store/CheckoutPage.css';

const CheckoutPage = () => {
  const { theme } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'cod'
  });

  const [orderItems] = useState([
    { id: '1', name: 'Sample Product 1', price: 29.99, quantity: 2 },
    { id: '2', name: 'Sample Product 2', price: 49.99, quantity: 1 }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement order submission
    console.log('Order submitted:', { formData, orderItems });
    alert('Order placed successfully!');
  };

  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className={`checkout-page-container ${theme === "dark" ? "dark-theme" : ""}`}>
      <Link to="/market" className="back-button">
        <FaArrowLeft />
      </Link>
      <div className="checkout-header">
        <h1>Checkout</h1>
        <Link to="/cart" className="back-to-cart">
          Back to Cart
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="checkout-content">
          {/* Shipping Information */}
          <div className="checkout-section">
            <div className="section-header">
              <FaMapMarkerAlt className="section-icon" />
              <h2>Shipping Information</h2>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <div className="section-header">
              <FaCreditCard className="section-icon" />
              <h2>Payment Method</h2>
            </div>

            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                />
                <span className="payment-label">
                  <span className="payment-name">Cash on Delivery</span>
                  <span className="payment-desc">Pay when you receive your order</span>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={handleInputChange}
                  disabled
                />
                <span className="payment-label">
                  <span className="payment-name">Credit/Debit Card</span>
                  <span className="payment-desc">Coming soon</span>
                </span>
              </label>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-section order-summary-section">
            <div className="section-header">
              <FaTruck className="section-icon" />
              <h2>Order Summary</h2>
            </div>

            <div className="order-items">
              {orderItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="total-row final-total">
                <span>Total</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" className="place-order-btn">
              Place Order
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
