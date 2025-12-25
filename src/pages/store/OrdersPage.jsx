import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../components/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

const OrdersPage = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        loadOrders(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadOrders = async (buyerId) => {
    try {
      const q = query(collection(db, 'Orders'), where('buyerId', '==', buyerId));
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const statusMap = {
    pending: { label: t('pending'), color: 'text-amber-600 bg-amber-50', icon: <Clock size={14} /> },
    shipped: { label: t('shipped'), color: 'text-blue-600 bg-blue-50', icon: <Truck size={14} /> },
    delivered: { label: t('delivered'), color: 'text-green-600 bg-green-50', icon: <CheckCircle size={14} /> },
    cancelled: { label: t('cancelled'), color: 'text-red-600 bg-red-50', icon: <XCircle size={14} /> },
  };

  const filteredOrders = orders.filter(o => activeTab === 'all' || o.status === activeTab);

  if (loading) return <div className="flex justify-center items-center h-screen animate-pulse text-gray-400 font-medium">{t('loadingOrders')}</div>;

  return (
    <div className={`min-h-screen pb-12 ${theme === "light" ? "bg-gray-50" : "bg-gray-900"}`}>
      {/* Header
      <div className={`${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"} border-b sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/market" className={`hover:${theme === "light" ? "bg-gray-100" : "bg-gray-700"} p-2 rounded-full transition`}><ArrowLeft size={20} /></Link>
          <h1 className={`text-xl font-bold ${theme === "light" ? "text-gray-800" : "text-white"}`}>Đơn hàng của tôi</h1>
        </div>
      </div> */}
      <div className={`${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/market" className={`p-2 hover:${theme === "light" ? "bg-gray-100" : "bg-gray-700"} rounded-full transition`}>
              <ArrowLeft size={20} className={`${theme === "light" ? "text-gray-600" : "text-gray-300"}`} />
            </Link>
            <h1 className={`text-xl font-bold ${theme === "light" ? "text-gray-800" : "text-white"}`}>{t('myOrders')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Tabs */}
        <div className={`flex ${theme === "light" ? "bg-white" : "bg-gray-800"} rounded-xl shadow-sm mb-6 overflow-hidden border ${theme === "light" ? "border-gray-200" : "border-gray-700"}`}>
          {['all', 'pending', 'shipped', 'delivered'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/30'
                  : `${theme === "light" ? "text-gray-500 hover:bg-gray-50" : "text-gray-400 hover:bg-gray-700"}`
              }`}
            >
              {tab === 'all' ? t('all') : statusMap[tab].label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className={`${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"} rounded-2xl p-12 text-center border`}>
              <Package size={48} className={`mx-auto mb-4 ${theme === "light" ? "text-gray-200" : "text-gray-600"}`} />
              <p className={`font-medium ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>Bạn chưa có đơn hàng nào trong mục này.</p>
              <Link to="/market" className="text-orange-600 font-bold mt-2 inline-block">Mua sắm ngay</Link>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`${theme === "light" ? "bg-white border-gray-100 hover:shadow-md" : "bg-gray-800 border-gray-700 hover:shadow-lg"} rounded-2xl shadow-sm border overflow-hidden transition`}>
                {/* Order Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${theme === "light" ? "bg-gray-50/50" : "bg-gray-700/50"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>#{order.id.slice(0, 10).toUpperCase()}</span>
                    <span className={`${theme === "light" ? "text-gray-300" : "text-gray-600"}`}>|</span>
                    <span className={`text-xs font-medium ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                      {order.date ? new Date(order.date).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase ${statusMap[order.status || 'pending'].color}`}>
                    {statusMap[order.status || 'pending'].icon}
                    {statusMap[order.status || 'pending'].label}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-6 space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className={`w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden border ${theme === "light" ? "bg-gray-100 border-gray-200" : "bg-gray-700 border-gray-600"}`}>
                        <img src={item.imageUrl || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold line-clamp-1 ${theme === "light" ? "text-gray-800" : "text-white"}`}>{item.name}</h4>
                        <p className={`text-xs mt-1 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>Phân loại: {item.category || 'Mặc định'}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs font-medium uppercase italic ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>Số lượng: {item.quantity}</span>
                          <span className={`text-sm font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>${item.price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className={`px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${theme === "light" ? "bg-orange-50/20" : "bg-orange-900/20"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>Thành tiền:</span>
                    <span className="text-xl font-black text-orange-600">${order.total?.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold border rounded-lg transition ${theme === "light" ? "text-gray-600 bg-white border-gray-200 hover:bg-gray-50" : "text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600"}`}>
                      Xem chi tiết
                    </button>
                    {order.status === 'delivered' && (
                      <button className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition shadow-sm">
                        Mua lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;