import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShieldCheck, Ticket } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

const CartPage = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);

  // Sửa lại các biến lấy từ Context cho đúng tên
  const { cart, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart();

  // Tính toán lại các giá trị dựa trên biến đúng
  const cartItems = cart || [];
  const subtotal = getTotalPrice ? getTotalPrice() : 0;

  const handleRemoveItem = (id) => {
    if (window.confirm(t("removeItemConfirm"))) {
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
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === "light" ? "bg-gray-50" : "bg-gray-900"}`}>
      <div className={`p-10 rounded-3xl shadow-sm text-center max-w-md w-full border ${theme === "light" ? "bg-white border-gray-100" : "bg-gray-800 border-gray-700"}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === "light" ? "bg-orange-50" : "bg-orange-900/20"}`}>
          <ShoppingBag size={48} className={theme === "light" ? "text-orange-500" : "text-orange-400"} />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${theme === "light" ? "text-gray-800" : "text-white"}`}>{t("emptyCart")}</h2>
        <p className={`mb-8 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>{t("emptyCartMessage")}</p>
        <Link to="/market" className="block w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200">
          {t("shopNow")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-20 ${theme === "light" ? "bg-[#fcfcfc]" : "bg-gray-900"}`}>
      <div className={`border-b sticky top-0 z-20 ${theme === "light" ? "bg-white" : "bg-gray-800"}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/market" className={`p-2 rounded-full transition ${theme === "light" ? "hover:bg-gray-100 text-gray-600" : "hover:bg-gray-700 text-gray-300"}`}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className={`text-xl font-bold ${theme === "light" ? "text-gray-800" : "text-white"}`}>{t("cart")} ({cartItems.length})</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className={`p-5 rounded-2xl flex justify-center border shadow-sm flex gap-4 md:gap-6 group transition-all ${theme === "light" ? "bg-white border-gray-100 hover:border-orange-200" : "bg-gray-800 border-gray-700 hover:border-orange-600"}`}>
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 border ${theme === "light" ? "bg-gray-50 border-gray-50" : "bg-gray-700 border-gray-600"}`}>
                  <img
                    src={item.imageUrl || '/placeholder-product.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-bold md:text-lg line-clamp-1 ${theme === "light" ? "text-gray-800" : "text-white"}`}>{item.name}</h3>
                      <p className={`text-sm mt-1 uppercase tracking-tight ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>{item.category || t("defaultCategory")}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className={`transition p-1 ${theme === "light" ? "text-gray-300 hover:text-red-500" : "text-gray-400 hover:text-red-400"}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="text-orange-600 font-black text-lg md:text-xl">
                      ${item.price?.toLocaleString()}
                    </div>

                    <div className={`flex items-center rounded-lg p-1 border ${theme === "light" ? "bg-gray-50 border-gray-200" : "bg-gray-700 border-gray-600"}`}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={`p-1.5 rounded-md transition ${item.quantity <= 1 ? 'text-gray-300' : theme === "light" ? 'hover:bg-white text-gray-600 shadow-sm' : 'hover:bg-gray-600 text-gray-300 shadow-sm'}`}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className={`w-10 text-center font-bold text-sm ${theme === "light" ? "text-gray-800" : "text-white"}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={`p-1.5 rounded-md transition ${theme === "light" ? "hover:bg-white text-gray-600 shadow-sm" : "hover:bg-gray-600 text-gray-300 shadow-sm"}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/market" className={`inline-flex items-center gap-2 text-sm font-bold transition mt-2 ${theme === "light" ? "text-gray-500 hover:text-orange-600" : "text-gray-400 hover:text-orange-400"}`}>
              <Plus size={16} /> {t("addMoreProducts")}
            </Link>
          </div>

          <div className="lg:w-[380px]">
            <div className={`rounded-3xl p-6 border shadow-sm sticky top-24 ${theme === "light" ? "bg-white border-gray-100" : "bg-gray-800 border-gray-700"}`}>
              <h3 className={`text-lg font-bold mb-6 ${theme === "light" ? "text-gray-800" : "text-white"}`}>{t("orderSummary")}</h3>
              <div className="space-y-4 border-b pb-6">
                <div className={`flex justify-between text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                  <span>{t("subtotal")} ({cartItems.length} {t("items")})</span>
                  <span className={`font-semibold ${theme === "light" ? "text-gray-800" : "text-white"}`}>${subtotal.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                  <span>{t("shippingFee")}</span>
                  <span className="text-green-600 font-bold italic">{t("free")}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-6">
                <span className={`font-bold ${theme === "light" ? "text-gray-800" : "text-white"}`}>{t("total")}</span>
                <span className="text-2xl font-black text-orange-600">${subtotal.toLocaleString()}</span>
              </div>
              <Link to="/checkout" className="block w-full bg-orange-600 text-white text-center py-4 rounded-2xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100 active:scale-95 mb-4">
                {t("checkoutNow")}
              </Link>
              <div className={`flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest mt-6 py-3 rounded-xl ${theme === "light" ? "text-gray-400 bg-gray-50" : "text-gray-500 bg-gray-700"}`}>
                <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> {t("secure")}</div>
                <div className="h-3 w-[1px] bg-gray-300"></div>
                <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> {t("authentic")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;