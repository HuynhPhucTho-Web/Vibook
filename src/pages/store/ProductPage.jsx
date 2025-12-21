import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, Package, Heart, Share2 } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { useCart } from '../../context/CartContext';
import { ThemeContext } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const ProductPage = () => {
  const { theme } = useContext(ThemeContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Tính toán rating trung bình từ dữ liệu thật
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const fetchProductData = useCallback(async () => {
    try {
      setLoading(true);
      const productRef = doc(db, 'Products', id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        setProduct({ id: productSnap.id, ...productSnap.data() });
        
        // Lấy đánh giá thật
        const q = query(
          collection(db, 'Reviews'),
          where('productId', '==', id),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const reviewSnap = await getDocs(q);
        setReviews(reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleAddToCart = async () => {
    if (product.stock <= 0) return toast.error("Sản phẩm đã hết hàng");
    try {
      await addToCart(product, quantity);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    }
  };

  const handleBuyNow = async () => {
    if (product.stock <= 0) return toast.error("Sản phẩm đã hết hàng");
    try {
      await addToCart(product, quantity);
      navigate('/checkout');
    } catch {
      toast.error('Lỗi khi chuyển hướng thanh toán');
    }
  };

  const isLight = theme === "light";

  if (loading) return (
    <div className={`flex justify-center items-center h-screen space-x-2 ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>
      <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce"></div>
      <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
    </div>
  );

  if (!product) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>
      <Package size={64} className={`${isLight ? "text-gray-200" : "text-gray-700"} mb-4`} />
      <h2 className={`text-xl font-bold ${isLight ? "text-gray-800" : "text-white"}`}>Sản phẩm không tồn tại</h2>
      <Link to="/market" className="text-orange-600 font-bold mt-4 flex items-center gap-2">
        <ArrowLeft size={18} /> Quay lại cửa hàng
      </Link>
    </div>
  );

  return (
    <div className={`min-h-screen pb-20 ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>
      {/* Navbar di động / Back button */}
      <div className={`${isLight ? "bg-white" : "bg-gray-800"} border-b sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/market" className={`p-2 hover:${isLight ? "bg-gray-100" : "bg-gray-700"} rounded-full transition ${isLight ? "text-gray-600" : "text-gray-400"}`}>
            <ArrowLeft size={20} />
          </Link>
          <div className="flex gap-2">
            <button onClick={() => setIsWishlisted(!isWishlisted)} className={`p-2 ${isLight ? "text-gray-400 hover:text-red-500" : "text-gray-500 hover:text-red-400"} transition`}>
              <Heart size={22} fill={isWishlisted ? "red" : "none"} stroke={isWishlisted ? "red" : "currentColor"} />
            </button>
            <button className={`p-2 ${isLight ? "text-gray-400 hover:text-orange-600" : "text-gray-500 hover:text-orange-400"} transition`}><Share2 size={22} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 ${isLight ? "bg-white" : "bg-gray-800"} p-6 md:p-10 rounded-3xl border ${isLight ? "border-gray-100" : "border-gray-700"} shadow-sm`}>

          {/* Section: Ảnh sản phẩm */}
          <div className="space-y-4">
            <div className={`aspect-square rounded-2xl overflow-hidden ${isLight ? "bg-gray-50 border-gray-50" : "bg-gray-700 border-gray-700"} flex items-center justify-center p-8 group`}>
              <img
                src={product.imageUrl || '/placeholder-product.jpg'}
                alt={product.name}
                className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-500"
              />
            </div>
          </div>

          {/* Section: Thông tin sản phẩm */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">
                {product.category || 'General'}
              </span>
              <h1 className={`text-3xl md:text-4xl font-black mt-4 leading-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-orange-500">
                  <Star size={18} fill="currentColor" />
                  <span className="font-bold text-lg">{averageRating}</span>
                </div>
                <span className={`${isLight ? "text-gray-400" : "text-gray-500"} font-medium`}>|</span>
                <span className={`${isLight ? "text-gray-500" : "text-gray-400"} font-medium`}>{reviews.length} đánh giá</span>
                <span className={`${isLight ? "text-gray-400" : "text-gray-500"} font-medium`}>|</span>
                <span className={`${isLight ? "text-gray-500" : "text-gray-400"} font-medium`}>Đã bán 1.2k+</span>
              </div>
            </div>

            <div className={`${isLight ? "bg-gray-50" : "bg-gray-700"} p-6 rounded-2xl mb-8 flex flex-col gap-1`}>
              <span className={`text-sm font-bold line-through ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                ${(product.price * 1.2).toFixed(2)}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-orange-600">${product.price}</span>
                <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  GIẢM 20%
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${isLight ? "text-gray-400" : "text-gray-500"}`}>Mô tả</h3>
                <p className={`${isLight ? "text-gray-600" : "text-gray-300"} leading-relaxed italic`}>{product.description}</p>
              </div>

              <div className={`flex flex-col gap-4 py-6 border-y ${isLight ? "border-gray-100" : "border-gray-700"}`}>
                <div className="flex items-center gap-6">
                  <span className={`text-sm font-bold ${isLight ? "text-gray-800" : "text-white"}`}>Số lượng:</span>
                  <div className={`flex items-center ${isLight ? "bg-white border-gray-200" : "bg-gray-800 border-gray-600"} border rounded-xl p-1 shadow-sm`}>
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q-1))}
                      className={`w-10 h-10 flex items-center justify-center hover:${isLight ? "bg-gray-50" : "bg-gray-700"} rounded-lg font-bold`}
                    >-</button>
                    <span className="w-12 text-center font-black">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock || 99, q+1))}
                      className={`w-10 h-10 flex items-center justify-center hover:${isLight ? "bg-gray-50" : "bg-gray-700"} rounded-lg font-bold`}
                    >+</button>
                  </div>
                  <span className={`text-sm font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex items-center justify-center gap-3 bg-white border-2 border-orange-600 text-orange-600 py-4 rounded-2xl font-black hover:bg-orange-50 transition active:scale-95 disabled:opacity-50"
                >
                  <ShoppingCart size={20} /> Thêm vào giỏ
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="bg-orange-600 text-white py-4 rounded-2xl font-black hover:bg-orange-700 transition shadow-lg shadow-orange-100 active:scale-95 disabled:bg-gray-200"
                >
                  Mua ngay
                </button>
              </div>
            </div>

            {/* Thông tin thêm */}
            <div className={`mt-8 flex flex-wrap gap-6 border-t pt-8 ${isLight ? "border-gray-100" : "border-gray-700"}`}>
               <div className={`flex items-center gap-2 text-xs font-bold uppercase ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                  <ShieldCheck className="text-green-500" size={18} /> Chính hãng 100%
               </div>
               <div className={`flex items-center gap-2 text-xs font-bold uppercase ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                  <Truck className="text-blue-500" size={18} /> Giao hàng toàn quốc
               </div>
            </div>
          </div>
        </div>

        {/* Section: Reviews từ Firebase */}
        <div className={`mt-12 ${isLight ? "bg-white" : "bg-gray-800"} rounded-3xl p-8 border ${isLight ? "border-gray-100" : "border-gray-700"} shadow-sm`}>
          <div className={`flex items-center justify-between mb-8 border-b pb-6 ${isLight ? "border-gray-100" : "border-gray-700"}`}>
            <h3 className={`text-2xl font-black ${isLight ? "text-gray-800" : "text-white"}`}>Đánh giá khách hàng</h3>
            <div className="text-right">
              <div className="text-3xl font-black text-orange-600">{averageRating}/5</div>
              <div className="flex text-orange-400 mt-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(averageRating) ? "currentColor" : "none"} />)}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {reviews.length === 0 ? (
              <p className={`${isLight ? "text-gray-400" : "text-gray-500"} italic text-center py-10`}>Chưa có đánh giá nào cho sản phẩm này.</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className={`border-b pb-8 last:border-0 ${isLight ? "border-gray-50" : "border-gray-700"}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                      {review.userName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{review.userName}</h4>
                      <div className="flex gap-1 text-orange-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />)}
                      </div>
                    </div>
                    <span className={`text-xs ml-auto font-medium ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                      {review.createdAt?.toDate?.().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className={`${isLight ? "text-gray-600" : "text-gray-300"} text-sm leading-relaxed pl-14`}>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;