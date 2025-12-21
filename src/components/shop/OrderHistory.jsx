import React, { useState, useEffect } from 'react';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // TODO: Load orders from Firebase
    loadOrders();
  }, []);

  const loadOrders = () => {
    // Mock data for now
    const mockOrders = [
      {
        id: 'ORD001',
        date: '2024-01-15',
        total: 79.98,
        status: 'delivered',
        items: [
          { name: 'Sample Product 1', quantity: 2, price: 29.99 },
          { name: 'Sample Product 2', quantity: 1, price: 49.99 }
        ]
      },
      {
        id: 'ORD002',
        date: '2024-01-10',
        total: 49.99,
        status: 'shipped',
        items: [
          { name: 'Sample Product 3', quantity: 1, price: 49.99 }
        ]
      }
    ];

    setOrders(mockOrders);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaBox className="status-icon pending" />;
      case 'shipped':
        return <FaTruck className="status-icon shipped" />;
      case 'delivered':
        return <FaCheckCircle className="status-icon delivered" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaBox className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h2>My Orders</h2>
        <p>Track and manage your orders</p>
      </div>

      <div className="order-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Orders
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button
          className={`tab-btn ${activeTab === 'shipped' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipped')}
        >
          Shipped
        </button>
        <button
          className={`tab-btn ${activeTab === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivered')}
        >
          Delivered
        </button>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found in this category.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id}</h3>
                  <p className="order-date">
                    {new Date(order.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="order-status">
                  {getStatusIcon(order.status)}
                  <span className="status-text">{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    <span className="item-price">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total: </span>
                  <span className="total-amount">${order.total.toFixed(2)}</span>
                </div>
                <div className="order-actions">
                  <button className="view-details-btn">View Details</button>
                  {order.status === 'delivered' && (
                    <button className="reorder-btn">Reorder</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
