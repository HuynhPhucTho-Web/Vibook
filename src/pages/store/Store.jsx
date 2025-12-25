import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Package, Store as StoreIcon, ChevronRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { useCart } from '../../context/CartContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import '../../style/store/Store.css';

const Store = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const { getTotalItems } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCate = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCate;
    });
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Products'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setCategories(['all', ...new Set(data.map(p => p.category).filter(Boolean))]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const isLight = theme === "light";

  if (loading) return (
    <div className={`flex justify-center items-center h-screen space-x-2 ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>
      <div className="w-4 h-4 bg-orange-600 rounded-full animate-bounce"></div>
      <div className="w-4 h-4 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-4 h-4 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isLight ? "bg-gray-50" : "bg-gray-900"}`}>
      {/* Search & Header Section */}
      <div className={`${isLight ? "bg-white" : "bg-gray-800"} border-b sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <StoreIcon className="text-orange-600" size={28} />
            <h1 className={`text-2xl font-black tracking-tight ${isLight ? "text-gray-800" : "text-white"}`}>{t('storeTitle')}</h1>
          </div>

          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder={t('searchProducts')}
              className={`w-full pl-10 pr-4 py-2.5 border-none rounded-full focus:ring-2 focus:ring-orange-500 transition-all ${isLight ? "bg-gray-100 text-black placeholder-gray-600" : "bg-gray-700 text-white placeholder-gray-400"}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className={`absolute left-3 top-3 ${isLight ? "text-gray-400" : "text-gray-500"}`} size={18} />
          </div>

          <div className="flex items-center gap-2 md:gap-5">

            <Link title={t('cart')} to="/cart" className={`relative p-2 transition ${isLight ? "text-gray-600 hover:text-orange-600" : "text-gray-400 hover:text-orange-400"}`}>
              <ShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute top-1 right-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            <Link title={t('orders')} to="/my-orders" className={`p-2 transition ${isLight ? "text-gray-600 hover:text-orange-600" : "text-gray-400 hover:text-orange-400"}`}>
              <Package size={24} />
            </Link>


            <Link title={t('sellerChannel')} to="/seller-dashboard" className={`p-2 transition flex items-center justify-center ${isLight ? "text-gray-600 hover:text-orange-600" : "text-gray-400 hover:text-orange-400"}`}>
              <StoreIcon size={24} />
              <span className="hidden lg:inline ml-2 text-sm font-bold">{t('sellerChannel')}</span>
            </Link>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">

        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className={`${isLight ? "bg-white" : "bg-gray-800"} p-6 rounded-xl shadow-sm border ${isLight ? "border-gray-100" : "border-gray-700"} sticky top-24`}>
            <div className={`flex items-center gap-2 mb-6 font-bold border-b pb-2 ${isLight ? "text-gray-800" : "text-white"}`}>
              <Filter size={18} /> {t('categories')}
            </div>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-lg capitalize transition-all ${selectedCategory === cat
                      ? 'bg-orange-50 text-orange-600 font-bold'
                      : `${isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-700'}`
                    }`}
                >
                  {cat === 'all' ? t('allProducts') : cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold italic ${isLight ? "text-gray-800" : "text-white"}`}>
              {selectedCategory === 'all' ? t('latestProducts') : `${t('category')}: ${selectedCategory}`}
            </h2>
            <span className={`text-sm font-medium ${isLight ? "text-gray-500" : "text-gray-400"}`}>{filteredProducts.length} {t('products')}</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className={`${isLight ? "bg-white" : "bg-gray-800"} rounded-2xl p-20 text-center shadow-sm border ${isLight ? "border-gray-100" : "border-gray-700"}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isLight ? "bg-gray-100 text-gray-400" : "bg-gray-700 text-gray-500"}`}>
                <Search size={40} />
              </div>
              <p className={`font-medium text-lg ${isLight ? "text-gray-500" : "text-gray-400"}`}>{t('noProductsFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className={`group ${isLight ? "bg-white" : "bg-gray-800"} rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border ${isLight ? "border-gray-100" : "border-gray-700"} overflow-hidden flex flex-col`}>
                  {/* Image Container */}
                  <div className={`relative aspect-square overflow-hidden ${isLight ? "bg-gray-200" : "bg-gray-700"}`}>
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {t('hot')}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLight ? "text-gray-400" : "text-gray-500"}`}>{product.category}</span>
                    <h3 className={`font-bold text-sm mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors ${isLight ? "text-gray-800" : "text-white"}`}>
                      {product.name}
                    </h3>

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-orange-600 font-black text-lg">${product.price}</span>
                        <span className={`text-xs line-through ${isLight ? "text-gray-400" : "text-gray-500"}`}>${(product.price * 1.3).toFixed(0)}</span>
                      </div>

                      <Link
                        to={`/product/${product.id}`}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors active:scale-95"
                      >
                        {t('viewDetails')} <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Store;