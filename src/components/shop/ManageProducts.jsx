import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaUpload, FaBox, FaLayerGroup, FaHistory } from 'react-icons/fa';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { ThemeContext } from '../../context/ThemeContext';
import '../../style/shop/ManageProducts.css';

const ManageProducts = () => {
  const { theme } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    status: 'active',
    stock: ''
  });

  // --- LOGIC GIỮ NGUYÊN ---
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadProducts(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && user && products.length > 0) {
      const productToEdit = products.find(p => p.id === editId);
      if (productToEdit) {
        handleEdit(productToEdit);
      }
    }
  }, [searchParams, user, products]);

  const loadProducts = async (sellerId) => {
    try {
      const productsQuery = query(collection(db, 'Products'), where('sellerId', '==', sellerId));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      setUploadingImage(true);
      const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadToCloudinary(selectedFile);
      }

      const productData = {
        ...formData,
        imageUrl,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        sellerId: user.uid,
        updatedAt: new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'Products', editingProduct.id), productData);
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      } else {
        productData.createdAt = new Date();
        const docRef = await addDoc(collection(db, 'Products'), productData);
        setProducts([...products, { id: docRef.id, ...productData }]);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      alert('Lỗi lưu sản phẩm!');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: '', imageUrl: '', status: 'active', stock: '' });
    setSelectedFile(null);
    setPreviewImage('');
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      status: product.status || 'active',
      stock: product.stock?.toString() || ''
    });
    setPreviewImage('');
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
      try {
        await deleteDoc(doc(db, 'Products', productId));
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) { console.error(error); }
    }
  };

  if (loading) return <div className="loading-container">Đang tải dữ liệu...</div>;

  return (
    <div className={`manage-products-container ${theme === "dark" ? "dark-theme" : ""}`}>
      {/* HEADER ĐỒNG BỘ */}
      <div className="manage-header-section">
        <div className="header-info">
          <Link to="/seller-dashboard" className="btn-back-circle">
            <FaArrowLeft />
          </Link>
          <div>
            <h1>Quản lý sản phẩm</h1>
            <p>Danh sách các mặt hàng bạn đang kinh doanh</p>
          </div>
        </div>
        <button className="btn-add-product" onClick={() => { resetForm(); setShowForm(true); }}>
          <FaPlus /> Thêm sản phẩm mới
        </button>
      </div>

      {/* THỐNG KÊ NHANH */}
      <div className="stats-mini-row">
        <div className="stat-card">
          <FaLayerGroup className="stat-icon blue" />
          <div className="stat-content">
            <span className="label">Tổng loại hàng</span>
            <span className="value">{products.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <FaBox className="stat-icon green" />
          <div className="stat-content">
            <span className="label">Tổng tồn kho</span>
            <span className="value">{products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0)}</span>
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU ĐẦY ĐỦ */}
        <div className="table-wrapper">
        <table className="products-data-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá niêm yết</th>
              <th>Kho (Stock)</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">Chưa có sản phẩm nào được tạo.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell-info">
                      <img src={product.imageUrl || '/placeholder.jpg'} alt="" />
                      <div className="txt-info">
                        <div className="p-name">{product.name}</div>
                        <div className="p-desc">{product.description?.substring(0, 40)}...</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="cate-tag">{product.category}</span></td>
                  <td className="price-tag">${parseFloat(product.price).toLocaleString()}</td>
                  <td>
                    <span className={`stock-tag ${(product.stock || 0) < 5 ? 'low' : ''}`}>
                      {product.stock || 0} cái
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${product.status}`}>
                      {product.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-actions">
                      <button className="edit-btn" onClick={() => handleEdit(product)} title="Sửa"><FaEdit /></button>
                      <button className="delete-btn" onClick={() => handleDelete(product.id)} title="Xóa"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="product-form-overlay">
          <div className="product-modal-card">
            {/* Header Modal */}
            <div className="modal-header-modern">
              <div>
                <h2>{editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                <p>Điền đầy đủ thông tin để niêm yết sản phẩm lên cửa hàng</p>
              </div>
              <button className="close-modal-btn" onClick={() => setShowForm(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="modern-form-body">
              <div className="form-scroll-area">

                {/* Phần 1: Thông tin cơ bản */}
                <section className="form-section">
                  <h3 className="section-title">Thông tin cơ bản</h3>
                  <div className="form-group">
                    <label>Tên sản phẩm *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Ví dụ: Apple iPhone 15 Pro Max"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả chi tiết *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Mô tả đặc điểm nổi bật, thông số kỹ thuật..."
                      rows="4"
                      required
                    />
                  </div>
                </section>

                {/* Phần 2: Giá và Kho hàng (Dùng Grid) */}
                <section className="form-section">
                  <h3 className="section-title">Giá & Kho hàng</h3>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Giá bán ($) *</label>
                      <div className="input-with-icon">
                        <span className="input-prefix">$</span>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Số lượng kho *</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="Nhập số lượng"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Danh mục</label>
                      <select name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="">Chọn loại sản phẩm</option>
                        <option value="Electronics">Điện tử</option>
                        <option value="Clothing">Quần áo & Thời trang</option>
                        <option value="Home">Đồ gia dụng</option>
                        <option value="Sports">Thể thao</option>
                        <option value="Other">Khác</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Trạng thái</label>
                      <select name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="active">Đang kinh doanh (Active)</option>
                        <option value="inactive">Tạm ngưng (Inactive)</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Phần 3: Hình ảnh */}
                <section className="form-section">
                  <h3 className="section-title">Hình ảnh sản phẩm</h3>
                  <div className="image-upload-modern">
                    <input type="file" id="p-image" hidden onChange={handleFileSelect} accept="image/*" />
                    <label htmlFor="p-image" className="upload-zone">
                      {previewImage || formData.imageUrl ? (
                        <div className="preview-container">
                          <img src={previewImage || formData.imageUrl} alt="Preview" />
                          <div className="change-img-overlay"><FaUpload /> Thay đổi ảnh</div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon-circle"><FaUpload /></div>
                          <span>Tải ảnh lên hoặc kéo thả vào đây</span>
                          <small>Dung lượng tối đa 5MB (JPG, PNG)</small>
                        </div>
                      )}
                    </label>
                    {uploadingImage && <div className="upload-progress-bar">Đang xử lý ảnh...</div>}
                  </div>
                </section>
              </div>

              {/* Nút hành động */}
              <div className="modal-footer-modern">
                <button type="button" className="btn-secondary-modern" onClick={() => setShowForm(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-submit-modern" disabled={uploadingImage}>
                  {uploadingImage ? 'Vui lòng đợi...' : (editingProduct ? 'Cập nhật thay đổi' : 'Đăng sản phẩm ngay')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;