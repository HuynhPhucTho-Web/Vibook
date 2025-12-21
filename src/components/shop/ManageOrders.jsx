import React, { useState, useEffect } from 'react';
import { FaEye, FaShippingFast, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import '../../style/shop/ManageOders.css';
const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = () => {
    // Mock data for now - replace with Firebase calls
    const mockOrders = [
      {
        id: 'ORD001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        total: 79.98,
        status: 'pending',
        date: '2024-01-15',
        items: [
          { name: 'Product A', quantity: 1, price: 29.99 },
          { name: 'Product B', quantity: 1, price: 49.99 }
        ],
        shippingAddress: '123 Main St, City, State 12345'
      },
      {
        id: 'ORD002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        total: 49.99,
        status: 'shipped',
        date: '2024-01-10',
        items: [
          { name: 'Product C', quantity: 1, price: 49.99 }
        ],
        shippingAddress: '456 Oak Ave, City, State 67890'
      },
      {
        id: 'ORD003',
        customerName: 'Bob Johnson',
        customerEmail: 'bob@example.com',
        total: 129.97,
        status: 'delivered',
        date: '2024-01-05',
        items: [
          { name: 'Product D', quantity: 2, price: 39.99 },
          { name: 'Product E', quantity: 1, price: 49.99 }
        ],
        shippingAddress: '789 Pine Rd, City, State 54321'
      }
    ];

    setOrders(mockOrders);
    setLoading(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#ffc107', text: 'Pending' },
      processing: { color: '#17a2b8', text: 'Processing' },
      shipped: { color: '#007bff', text: 'Shipped' },
      delivered: { color: '#28a745', text: 'Delivered' },
      cancelled: { color: '#dc3545', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: '#6c757d', text: status };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <button
              className="action-btn process"
              onClick={() => updateOrderStatus(order.id, 'processing')}
            >
              <FaCheck /> Process
            </button>
            <button
              className="action-btn cancel"
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
            >
              <FaTimes /> Cancel
            </button>
          </>
        );
      case 'processing':
        return (
          <button
            className="action-btn ship"
            onClick={() => updateOrderStatus(order.id, 'shipped')}
          >
            <FaShippingFast /> Ship
          </button>
        );
      case 'shipped':
        return (
          <button
            className="action-btn deliver"
            onClick={() => updateOrderStatus(order.id, 'delivered')}
          >
            <FaCheck /> Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="manage-orders-container">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="manage-orders-container">
      <div className="orders-header">
        <h2>Manage Orders</h2>
        <p>Track and manage customer orders</p>
      </div>

      <div className="orders-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-item">
          <span className="stat-number">{orders.filter(o => o.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{orders.filter(o => o.status === 'processing').length}</span>
          <span className="stat-label">Processing</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{orders.filter(o => o.status === 'shipped').length}</span>
          <span className="stat-label">Shipped</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{orders.filter(o => o.status === 'delivered').length}</span>
          <span className="stat-label">Delivered</span>
        </div>
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

        {filteredOrders.map(order => (
          <div key={order.id} className="table-row">
            <div className="order-id">#{order.id}</div>
            <div className="customer-info">
              <div className="customer-name">{order.customerName}</div>
              <div className="customer-email">{order.customerEmail}</div>
            </div>
            <div className="order-total">${order.total.toFixed(2)}</div>
            <div>{getStatusBadge(order.status)}</div>
            <div>{new Date(order.date).toLocaleDateString()}</div>
            <div className="order-actions">
              <button className="action-btn view" title="View Details">
                <FaEye />
              </button>
              {getStatusActions(order)}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="no-orders">
          <p>No orders found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
