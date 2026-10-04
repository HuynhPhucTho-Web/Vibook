import React, { useEffect, useState, useLayoutEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
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
import AboutPage, { PrivacyPolicyPage, TermsOfServicePage, ContentPolicyPage, OtherStandardsPage } from "./pages/AboutPages";
import SourcePage from "./pages/source/SourcePage";
import { clearLoginRedirect, getLoginRedirect } from "./utils/requireLogin";
import { VideoPlayerProvider } from "./context/VideoPlayerContext";
import GlobalPlayer from "./components/video/GlobalPlayer";

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
      <GlobalPlayer />
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Set theme classes on document element immediately before rendering loading state
  // to avoid white flash in dark mode.
  useLayoutEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const background = localStorage.getItem("app_background") || "default";
    const bgColors = {
      default: { light: "#f4f2fb", dark: "#0c0d14" },
      sky: { light: "#eef6ff", dark: "#0b1525" },
      lavender: { light: "#f5f1ff", dark: "#171225" },
      mint: { light: "#effbf6", dark: "#0c1d18" },
      warm: { light: "#fff7ed", dark: "#21160f" },
    };
    const selectedBackground = bgColors[background] || bgColors.default;
    document.documentElement.style.setProperty("--app-background", selectedBackground[theme]);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 1100; // Đảm bảo hiệu ứng intro xuất hiện trọn vẹn

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);
      setUser(user);

      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, MIN_DISPLAY_TIME - elapsed);

      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setLoading(false);
        }, 400); // 400ms mờ dần mượt mà
      }, delay);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    const getLoadingText = () => {
      const lang = localStorage.getItem("language") || "vi";
      if (lang === "vi") return "Đang tải ThoDev...";
      if (lang === "ja") return "ThoDevを読み込み中...";
      return "Loading ThoDev...";
    };

    return (
      <div className={`loading-container ${isFadingOut ? "loading-fade-out" : ""}`}>
        {/* Subtle, soft ambient glow directly behind the card */}
        <div className="loading-ambient-glow" />

        {/* Compact, refined brand card */}
        <div className="loading-brand-card">
          {/* Main logo */}
          <div className="loading-logo-wrapper">
            <svg
              viewBox="0 0 100 100"
              width="76"
              height="76"
              className="loading-logo-svg"
            >
              <defs>
                <linearGradient
                  id="logoGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                <filter
                  id="glow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer rotating ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="2.5"
                strokeDasharray="160 115"
                className="loading-ring-outer"
              />

              {/* Inner rotating ring */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeDasharray="65 90"
                opacity="0.6"
                className="loading-ring-inner"
              />

              {/* Logo V */}
              <path
                d="M36 40 L50 63 L64 40"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="loading-logo-v"
              />

              {/* Center point */}
              <circle
                cx="50"
                cy="50"
                r="2.5"
                fill="#ffffff"
                className="loading-center-dot"
              />
            </svg>
          </div>

          {/* Brand */}
          <div className="loading-text">
            <h1 className="loading-app-title">
              <span>Tho</span>Dev
            </h1>

            <div className="loading-status-wrapper">
              <span className="loading-status-dot" />
              <p className="loading-app-status">
                {getLoadingText()}
              </p>
            </div>
          </div>

          {/* Loading line */}
          <div className="loading-progress">
            <div className="loading-progress-bar" />
          </div>
        </div>
      </div>
    );

  }

  return (
    <VideoPlayerProvider>
      <HelmetProvider>
        <LanguageProvider>
          <ThemeProvider>
            <SearchProvider>
              <CartProvider>
                <Router>
                  <Routes>
                    {/* Default entry: home for everyone (guests included) */}
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    <Route path="/homevibook" element={<Navigate to="/feed" replace />} />

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
                      <Route path="/feed" element={<Home />} />
                      <Route path="/profile/:uid" element={<Profile />} />
                      <Route path="/user/:uid" element={<UserDetailPage />} />
                      <Route path="/post/:postId" element={<PostDetail />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/story" element={<Storys />} />
                      <Route path="/blog" element={<BlogPages />} />
                      <Route path="/blog/:slug" element={<BlogPages />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                      <Route path="/content-policy" element={<ContentPolicyPage />} />
                      <Route path="/other-standards" element={<OtherStandardsPage />} />
                      <Route path="/playgame" element={<PlayGame />} />
                      <Route path="/market" element={<Store />} />
                      <Route path="/product/:id" element={<ProductPage />} />
                      <Route path="/videos" element={<Video />} />
                      {/* Friends: public browse; friend-request actions gated in UI/handlers */}
                      <Route path="/friends" element={<Friends />} />
                      <Route path="/settings" element={<Setting />} />
                      <Route path="/source" element={<SourcePage />} />
                      <Route path="/source/:subjectCode" element={<SourcePage />} />
                      <Route path="/source/:subjectCode/:tab" element={<SourcePage />} />

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
      </HelmetProvider>
    </VideoPlayerProvider>
  );
}

export default App;
