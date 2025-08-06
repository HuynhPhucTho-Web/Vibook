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
import Login from "./components/login";
import SignUp from "./components/register";
import Home from "./pages/home";
import Profile from "./pages/Profile";
import Messenger from "./pages/Messenger";
import Notifications from "./pages/Notifications";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Reels from "./pages/Reels";
import Pages from "./pages/Pages";
import PageManagement from "./pages/PageManagement";
import Inbox from "./pages/Inbox";
import Insights from "./pages/Insights";
import CommentManagement from "./pages/CommentManagement";
import FanBadges from "./pages/FanBadges";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { auth } from "./components/firebase";
import { ThemeProvider } from "./components/ThemeProvider";

// Layout for authentication pages
const AuthLayout = () => (
  <div className="App">
    <div className="auth-wrapper">
      <div className="auth-inner">
        <Outlet />
      </div>
    </div>
  </div>
);

// Layout for protected pages
const MainLayout = () => (
  <div className="App">
    <Header />
    <main className="container py-4">
      <div className="row g-4">
        <Sidebar />
        <section className="col-lg-9">
          <Outlet />
        </section>
      </div>
    </main>
  </div>
);

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
    return <div className="container py-4">Loading...</div>;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={user ? <Navigate to="/homevibook" /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route path="/homevibook" element={user ? <Home /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/messenger" element={user ? <Messenger /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
            <Route path="/groups" element={user ? <Groups /> : <Navigate to="/login" />} />
            <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
            <Route path="/reels" element={user ? <Reels /> : <Navigate to="/login" />} />
            <Route path="/pages" element={user ? <Pages /> : <Navigate to="/login" />} />
            <Route path="/page-management" element={user ? <PageManagement /> : <Navigate to="/login" />} />
            <Route path="/inbox" element={user ? <Inbox /> : <Navigate to="/login" />} />
            <Route path="/insights" element={user ? <Insights /> : <Navigate to="/login" />} />
            <Route path="/comment-management" element={user ? <CommentManagement /> : <Navigate to="/login" />} />
            <Route path="/fan-badges" element={user ? <FanBadges /> : <Navigate to="/login" />} />
          </Route>
        </Routes>
        <ToastContainer />
      </Router>
    </ThemeProvider>
  );
}

export default App;