import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaShoppingCart, FaArrowLeft, FaStar, FaHeart } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id, fetchProduct]);

  const fetchProduct = async () => {
    try {
      const productRef = doc(db, 'products', id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        setProduct({ id: productSnap.id, ...productSnap.data() });
      } else {
        console.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log(`Adding ${quantity} of ${product.name} to cart`);
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-spinner">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="product-not-found">
          <h2>Product not found</h2>
          <Link to="/market" className="back-to-market">
            <FaArrowLeft /> Back to Market
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <Link to="/market" className="back-button">
        <FaArrowLeft /> Back to Market
      </Link>

      <div className="product-detail-content">
        <div className="product-gallery">
          <img
            src={product.imageUrl || '/placeholder-product.jpg'}
            alt={product.name}
            className="main-product-image"
            onError={(e) => {
              e.target.src = '/placeholder-product.jpg';
            }}
          />
        </div>

        <div className="product-info-section">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <button
              className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
              onClick={handleAddToWishlist}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FaHeart />
            </button>
          </div>

          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="star filled" />
              ))}
            </div>
            <span className="rating-text">(4.5) • 120 reviews</span>
          </div>

          <div className="product-price">
            <span className="current-price">${product.price}</span>
            {product.originalPrice && (
              <span className="original-price">${product.originalPrice}</span>
            )}
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="product-details">
            {product.category && (
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{product.category}</span>
              </div>
            )}
            {product.brand && (
              <div className="detail-item">
                <span className="detail-label">Brand:</span>
                <span className="detail-value">{product.brand}</span>
              </div>
            )}
            {product.sellerName && (
              <div className="detail-item">
                <span className="detail-label">Sold by:</span>
                <span className="detail-value">{product.sellerName}</span>
              </div>
            )}
            {product.stock > 0 && (
              <div className="detail-item">
                <span className="detail-label">Stock:</span>
                <span className="detail-value">{product.stock} available</span>
              </div>
            )}
          </div>

          <div className="purchase-section">
            <div className="quantity-selector">
              <button
                className="quantity-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-value">{quantity}</span>
              <button
                className="quantity-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= (product.stock || 999)}
              >
                +
              </button>
            </div>

            <div className="action-buttons">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <FaShoppingCart /> Add to Cart
              </button>

              <Link to="/checkout" className="buy-now-btn">
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections can be added here */}
      <div className="product-reviews">
        <h3>Customer Reviews</h3>
        <div className="reviews-placeholder">
          <p>Reviews will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
