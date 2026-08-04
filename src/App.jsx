import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/login";
import SignUp from "./components/register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Messenger from "./pages/Messenger";
import Notifications from "./pages/Notifications";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Storys from "./pages/StoryPages";
import PlayGame from "./pages/PlayGame";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import GroupPage from "./pages/GroupPage";
import { auth } from "./components/firebase";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { SearchProvider } from "./context/SearchContext";
import GroupMembers from "./pages/group/GroupMembers";
import GroupMedia from "./pages/group/GroupMedia";
import GroupEvents from "./pages/group/GroupEvents";
import GroupInfo from "./pages/group/GroupInfo";
import GroupHome from "./pages/group/GroupHome";
import PostDetail from "./pages/PostDetail";
import UserDetailPage from "./pages/UserDetailPage";
import Friends from "./pages/friends/FriendPage";
import Store from "./pages/store/Store";
import ProductPage from "./pages/store/ProductPage";
import CartPage from "./pages/store/CartPage";
import CheckoutPage from "./pages/store/CheckoutPage";
import OrdersPage from "./pages/store/OrdersPage";
import SellerPage from "./pages/store/SellerPage";
import ManageProducts from "./components/shop/ManageProducts";
import { CartProvider } from "./context/CartContext";
import Video from "./pages/video/VideoHub";
import Setting from "./pages/Setting";
import RequireAuth from "./components/auth/RequireAuth";
import BlogPages from "./pages/blog/BlogPages";
import { clearLoginRedirect, getLoginRedirect } from "./utils/requireLogin";

// Layout for authentication pages
const AuthLayout = () => (
  <div className="App auth-layout">
    <div className="auth-wrapper">
      <div className="auth-inner">
        <Outlet />
      </div>
    </div>
  </div>
);

/**
 * Auth pages (login/register): only skip when fully signed in + email verified.
 * Unverified Firebase sessions must NOT bounce to home (register flow).
 */
const AuthEntry = ({ user, children }) => {
  const location = useLocation();
  const isFullySignedIn = Boolean(user?.emailVerified);
  if (isFullySignedIn) {
    const from = getLoginRedirect(location.state?.from);
    clearLoginRedirect();
    return <Navigate to={from} replace />;
  }
  return children;
};

const MainLayout = () => {
  return (
    <div className="App app-shell">
      <Header />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__main">
          <div className="app-shell__content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading ViBook...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <SearchProvider>
          <CartProvider>
          <Router>
            <Routes>
              {/* Default entry: home for everyone (guests included) */}
              <Route path="/" element={<Navigate to="/homevibook" replace />} />

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route
                  path="/login"
                  element={
                    <AuthEntry user={user}>
                      <Login />
                    </AuthEntry>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthEntry user={user}>
                      <SignUp />
                    </AuthEntry>
                  }
                />
              </Route>

              {/* Main app shell — public pages open without login */}
              <Route element={<MainLayout />}>
                {/* —— Public (browse without auth) —— */}
                <Route path="/homevibook" element={<Home />} />
                <Route path="/profile/:uid" element={<Profile />} />
                <Route path="/user/:uid" element={<UserDetailPage />} />
                <Route path="/post/:postId" element={<PostDetail />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/events" element={<Events />} />
                <Route path="/story" element={<Storys />} />
                <Route path="/blog" element={<BlogPages />} />
                <Route path="/blog/:slug" element={<BlogPages />} />
                <Route path="/playgame" element={<PlayGame />} />
                <Route path="/market" element={<Store />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/videos" element={<Video />} />
                {/* Friends: public browse; friend-request actions gated in UI/handlers */}
                <Route path="/friends" element={<Friends />} />
                {/* Settings: guest may open page; private sections gated in UI */}
                <Route path="/settings" element={<Setting />} />

                <Route path="groups/:groupId" element={<GroupPage />}>
                  <Route index element={<GroupHome />} />
                  <Route path="members" element={<GroupMembers />} />
                  <Route path="media" element={<GroupMedia />} />
                  <Route path="events" element={<GroupEvents />} />
                  <Route path="about" element={<GroupInfo />} />
                  <Route path="*" element={<Navigate to="." replace />} />
                </Route>

                {/* —— Private: messenger + account/commerce —— */}
                <Route element={<RequireAuth user={user} />}>
                  <Route path="/messenger" element={<Messenger />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/my-orders" element={<OrdersPage />} />
                  <Route path="/seller-dashboard" element={<SellerPage />} />
                  <Route path="/manage-products" element={<ManageProducts />} />
                </Route>
              </Route>
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              toastClassName="custom-toast"
              bodyClassName="custom-toast-body"
            />
          </Router>
          </CartProvider>
        </SearchProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
