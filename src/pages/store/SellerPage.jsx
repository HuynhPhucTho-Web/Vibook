import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, Package, ShoppingCart, DollarSign, ArrowLeft, MoreHorizontal, Calendar, Hash } from 'lucide-react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../components/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import '../../style/store/SellerPage.css';

const SellerPage = () => {
  const { theme } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        loadSellerData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSellerData = async (sellerId) => {
    try {
      const pQuery = query(collection(db, 'Products'), where('sellerId', '==', sellerId));
      const oQuery = query(collection(db, 'Orders'), where('sellerId', '==', sellerId));
      
      const [pSnap, oSnap] = await Promise.all([getDocs(pQuery), getDocs(oQuery)]);
      
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setOrders(oSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      await deleteDoc(doc(db, 'Products', id));
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      delivered: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return `px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const isLight = theme === "light";

  if (loading) return <div className={`flex justify-center items-center h-screen font-medium ${isLight ? "text-gray-500" : "text-gray-400"} ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>Đang tải dữ liệu người bán...</div>;

  return (
    <div className={`min-h-screen pb-20 ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>
      {/* Top Header */}
      <div className={`${isLight ? "bg-white" : "bg-gray-800"} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/market" className={`p-2 hover:${isLight ? "bg-gray-100" : "bg-gray-700"} rounded-full transition`}>
              <ArrowLeft size={20} className={`${isLight ? "text-gray-600" : "text-gray-400"}`} />
            </Link>
            <h1 className={`text-xl font-bold ${isLight ? "text-gray-800" : "text-white"}`}>Kênh Người Bán</h1>
          </div>
          <Link to="/manage-products" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-orange-100 text-sm">
            <Plus size={18} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Sản phẩm của tôi', value: products.length, icon: <Package className="text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Đơn hàng mới', value: orders.length, icon: <ShoppingCart className="text-orange-600" />, bg: 'bg-orange-50' },
            { label: 'Tổng doanh thu', value: `$${orders.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}`, icon: <DollarSign className="text-green-600" />, bg: 'bg-green-50' },
          ].map((stat, i) => (
            <div key={i} className={`${isLight ? "bg-white" : "bg-gray-800"} p-6 rounded-2xl shadow-sm border ${isLight ? "border-gray-100" : "border-gray-700"} flex items-center gap-5`}>
              <div className={`${stat.bg} p-4 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className={`text-sm font-medium ${isLight ? "text-gray-500" : "text-gray-400"}`}>{stat.label}</p>
                <h3 className={`text-2xl font-black ${isLight ? "text-gray-800" : "text-white"}`}>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className={`${isLight ? "bg-white" : "bg-gray-800"} rounded-2xl shadow-sm border ${isLight ? "border-gray-100" : "border-gray-700"} overflow-hidden`}>
          <div className={`flex border-b ${isLight ? "bg-gray-50/50" : "bg-gray-700/50"}`}>
            {['products', 'orders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab ? 'text-orange-600 bg-white' : `${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-300'}`
                }`}
              >
                {tab === 'products' ? 'Quản lý sản phẩm' : 'Đơn hàng đã nhận'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'products' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`${isLight ? "text-gray-400" : "text-gray-500"} text-xs uppercase tracking-wider border-b`}>
                      <th className="pb-4 font-semibold px-2">Thông tin sản phẩm</th>
                      <th className="pb-4 font-semibold">Danh mục</th>
                      <th className="pb-4 font-semibold">Giá</th>
                      <th className="pb-4 font-semibold">Kho hàng</th>
                      <th className="pb-4 font-semibold">Trạng thái</th>
                      <th className="pb-4 font-semibold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? "divide-gray-50" : "divide-gray-700"}`}>
                    {products.map((p) => (
                      <tr key={p.id} className={`group hover:${isLight ? "bg-gray-50/80" : "bg-gray-700/50"} transition-colors`}>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                            <div className="flex flex-col">
                              <span className={`font-bold text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{p.name}</span>
                              <span className={`text-[10px] font-mono ${isLight ? "text-gray-400" : "text-gray-500"}`}>ID: {p.id.slice(0,8).toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4"><span className={`text-xs px-2 py-1 rounded ${isLight ? "bg-gray-100 text-gray-600" : "bg-gray-700 text-gray-300"}`}>{p.category}</span></td>
                        <td className={`py-4 font-black ${isLight ? "text-gray-800" : "text-white"}`}>${p.price?.toFixed(2)}</td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${Number(p.stock) < 5 ? 'text-red-500' : (isLight ? 'text-gray-700' : 'text-gray-300')}`}>
                              {p.stock || 0} sản phẩm
                            </span>
                            {Number(p.stock) < 5 && <span className="text-[9px] text-red-400 italic">Sắp hết hàng!</span>}
                          </div>
                        </td>
                        <td className="py-4"><span className={getStatusStyle(p.status || 'active')}>{p.status || 'Active'}</span></td>
                        <td className="py-4">
                          <div className="flex justify-center gap-1">
                            <Link to={`/manage-products?edit=${p.id}`} className={`p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition`} title="Sửa"><Edit3 size={16} /></Link>
                            <button onClick={() => handleDeleteProduct(p.id)} className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition`} title="Xóa"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Orders View */
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                  <thead>
                    <tr className={`${isLight ? "text-gray-400" : "text-gray-500"} text-xs uppercase tracking-wider border-b`}>
                      <th className="pb-4 font-semibold px-2">Đơn hàng</th>
                      <th className="pb-4 font-semibold">Khách hàng</th>
                      <th className="pb-4 font-semibold">Thời gian</th>
                      <th className="pb-4 font-semibold">Tổng tiền</th>
                      <th className="pb-4 font-semibold">Trạng thái</th>
                      <th className="pb-4 font-semibold text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? "divide-gray-50" : "divide-gray-700"}`}>
                    {orders.map((o) => (
                      <tr key={o.id} className={`hover:${isLight ? "bg-gray-50/80" : "bg-gray-700/50"} transition-colors`}>
                        <td className="py-4 px-2">
                           <div className="flex items-center gap-2">
                              <Hash size={14} className={`${isLight ? "text-gray-400" : "text-gray-500"}`} />
                              <span className={`font-mono text-xs font-bold uppercase ${isLight ? "text-gray-500" : "text-gray-400"}`}>{o.id.slice(0,8)}</span>
                           </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{o.customerName || 'Người mua ẩn danh'}</span>
                            <span className={`text-[11px] ${isLight ? "text-gray-400" : "text-gray-500"}`}>{o.customerEmail || 'no-email@market.com'}</span>
                          </div>
                        </td>
                        <td className={`py-4 text-xs flex items-center gap-1 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                          <Calendar size={12} />
                          {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Mới đây'}
                        </td>
                        <td className="py-4 font-black text-orange-600">${o.total?.toFixed(2)}</td>
                        <td className="py-4"><span className={getStatusStyle(o.status || 'pending')}>{o.status || 'Pending'}</span></td>
                        <td className="py-4 text-center">
                           <button className={`p-2 hover:${isLight ? "bg-gray-100" : "bg-gray-700"} rounded-lg transition ${isLight ? "text-gray-400" : "text-gray-500"}`} title="Xem chi tiết">
                              <MoreHorizontal size={20} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPage;