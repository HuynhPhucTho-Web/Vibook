import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShieldCheck, Ticket } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const CartPage = () => {
  // Sửa lại các biến lấy từ Context cho đúng tên
  const { cart, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart();

  // Tính toán lại các giá trị dựa trên biến đúng
  const cartItems = cart || []; 
  const subtotal = getTotalPrice ? getTotalPrice() : 0;

  const handleRemoveItem = (id) => {
    if (window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) {
      removeFromCart(id);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen space-x-2">
      <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce"></div>
      <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={48} className="text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-8">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng của mình.</p>
        <Link to="/market" className="block w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200">
          Mua sắm ngay
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/market" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Giỏ hàng ({cartItems.length})</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 md:gap-6 group transition-all hover:border-orange-200">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50">
                  <img 
                    src={item.imageUrl || '/placeholder-product.jpg'} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 md:text-lg line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-gray-400 mt-1 uppercase tracking-tight">{item.category || 'Phân loại mặc định'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition p-1"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="text-orange-600 font-black text-lg md:text-xl">
                      ${item.price?.toLocaleString()}
                    </div>
                    
                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={`p-1.5 rounded-md transition ${item.quantity <= 1 ? 'text-gray-300' : 'hover:bg-white text-gray-600 shadow-sm'}`}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-white rounded-md text-gray-600 transition shadow-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/market" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 transition mt-2">
              <Plus size={16} /> Thêm sản phẩm khác
            </Link>
          </div>

          <div className="lg:w-[380px]">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Thông tin đơn hàng</h3>
              <div className="space-y-4 border-b pb-6">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Tạm tính ({cartItems.length} món)</span>
                  <span className="font-semibold text-gray-800">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 font-bold italic">Miễn phí</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-6">
                <span className="font-bold text-gray-800">Tổng cộng</span>
                <span className="text-2xl font-black text-orange-600">${subtotal.toLocaleString()}</span>
              </div>
              <Link to="/checkout" className="block w-full bg-orange-600 text-white text-center py-4 rounded-2xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100 active:scale-95 mb-4">
                Thanh toán ngay
              </Link>
              <div className="flex items-center justify-center gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-6 bg-gray-50 py-3 rounded-xl">
                <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> An toàn</div>
                <div className="h-3 w-[1px] bg-gray-300"></div>
                <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> Chính hãng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;