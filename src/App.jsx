import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./style/App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import SignUp from "./components/register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Messenger from "./pages/Messenger";
import Notifications from "./pages/Notifications";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Storys from "./pages/StoryPages";
import PlayGame from "./pages/PlayGame";
import PageManagement from "./pages/PageManagement";
import Inbox from "./pages/Inbox";
import Insights from "./pages/Insights";
import CommentManagement from "./pages/CommentManagement";
import FanBadges from "./pages/FanBadges";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { auth } from "./components/firebase";
import { ThemeProvider } from "./context/ThemeProvider";

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

// Layout for protected pages
const MainLayout = () => {
  const [sidebarWidth, setSidebarWidth] = useState('250px'); // Default width when expanded
  const headerHeight = 0; // Height of the header in pixels

  const handleSidebarToggle = () => {
    setSidebarWidth((prev) => (prev === '250px' ? '60px' : '250px'));
  };

  return (
    <div className="App">
      <Header onSidebarToggle={handleSidebarToggle} />
      <div style={{ height: `${headerHeight}px` }} aria-hidden="true" /> {/* Spacer for header */}
      <div className="d-flex flex-nowrap">
        <Sidebar style={{ width: sidebarWidth }} />
        <main className="container flex-grow-1">
          <div className="row g-2">
            <section className="col-lg-12 flex-grow-1">
              <Outlet />
            </section>
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
      console.log('Auth state changed:', user);
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
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={user ? <Navigate to="/homevibook" /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
          </Route>
          
          {/* Protected Routes with Layout mới */}
          <Route element={<MainLayout />}>
            <Route path="/homevibook" element={user ? <Home /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/messenger" element={user ? <Messenger /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
            <Route path="/groups" element={user ? <Groups /> : <Navigate to="/login" />} />
            <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
            <Route path="/story" element={user ? <Storys /> : <Navigate to="/login" />} />
            <Route path="/playgame" element={user ? <PlayGame /> : <Navigate to="/login" />} />
            <Route path="/page-management" element={user ? <PageManagement /> : <Navigate to="/login" />} />
            <Route path="/inbox" element={user ? <Inbox /> : <Navigate to="/login" />} />
            <Route path="/insights" element={user ? <Insights /> : <Navigate to="/login" />} />
            <Route path="/comment-management" element={user ? <CommentManagement /> : <Navigate to="/login" />} />
            <Route path="/fan-badges" element={user ? <FanBadges /> : <Navigate to="/login" />} />
          </Route>
        </Routes>
        
        {/* Toast Container với style tùy chỉnh */}
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
    </ThemeProvider>
  );
}

export default App;