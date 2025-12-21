import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBox, FaShoppingCart, FaUsers } from 'react-icons/fa';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    // TODO: Load seller's products and orders from Firebase
    loadSellerData();
  }, []);

  const loadSellerData = () => {
    // Mock data for now
    const mockProducts = [
      {
        id: '1',
        name: 'Sample Product 1',
        price: 29.99,
        category: 'Electronics',
        status: 'active',
        sales: 15
      },
      {
        id: '2',
        name: 'Sample Product 2',
        price: 49.99,
        category: 'Clothing',
        status: 'active',
        sales: 8
      }
    ];

    const mockOrders = [
      {
        id: 'ORD001',
        customerName: 'John Doe',
        total: 79.98,
        status: 'pending',
        date: '2024-01-15'
      },
      {
        id: 'ORD002',
        customerName: 'Jane Smith',
        total: 49.99,
        status: 'shipped',
        date: '2024-01-10'
      }
    ];

    setProducts(mockProducts);
    setOrders(mockOrders);
    setLoading(false);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-active',
      inactive: 'status-inactive',
      pending: 'status-pending',
      shipped: 'status-shipped',
      delivered: 'status-delivered'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="seller-dashboard-container">
        <div className="loading-spinner">Loading seller dashboard...</div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard-container">
      <div className="seller-header">
        <h2>Seller Dashboard</h2>
        <p>Manage your products and orders</p>
      </div>

      <div className="seller-stats">
        <div className="stat-card">
          <FaBox className="stat-icon" />
          <div className="stat-info">
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="stat-card">
          <FaShoppingCart className="stat-icon" />
          <div className="stat-info">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div className="stat-info">
            <h3>{products.reduce((sum, p) => sum + p.sales, 0)}</h3>
            <p>Total Sales</p>
          </div>
        </div>
      </div>

      <div className="seller-tabs">
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          My Products
        </button>
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Manage Orders
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="products-section">
          <div className="section-header">
            <h3>My Products</h3>
            <Link to="/add-product" className="add-product-btn">
              <FaPlus /> Add New Product
            </Link>
          </div>

          <div className="products-table">
            <div className="table-header">
              <div>Product</div>
              <div>Category</div>
              <div>Price</div>
              <div>Status</div>
              <div>Sales</div>
              <div>Actions</div>
            </div>

            {products.map(product => (
              <div key={product.id} className="table-row">
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                </div>
                <div>{product.category}</div>
                <div>${product.price.toFixed(2)}</div>
                <div>{getStatusBadge(product.status)}</div>
                <div>{product.sales}</div>
                <div className="actions">
                  <button className="action-btn edit" title="Edit">
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete"
                    title="Delete"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-section">
          <div className="section-header">
            <h3>Recent Orders</h3>
          </div>

          <div className="orders-table">
            <div className="table-header">
              <div>Order ID</div>
              <div>Customer</div>
              <div>Total</div>
              <div>Status</div>
              <div>Date</div>
              <div>Actions</div>
            </div>

            {orders.map(order => (
              <div key={order.id} className="table-row">
                <div className="order-id">#{order.id}</div>
                <div>{order.customerName}</div>
                <div>${order.total.toFixed(2)}</div>
                <div>{getStatusBadge(order.status)}</div>
                <div>{new Date(order.date).toLocaleDateString()}</div>
                <div className="actions">
                  <button className="action-btn view">View</button>
                  <button className="action-btn update">Update Status</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
