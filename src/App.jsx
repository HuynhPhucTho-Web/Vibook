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
import { ThemeProvider } from "./context/ThemeProvider";
import { LanguageProvider } from "./context/LanguageContext";
import GroupMembers from "./pages/group/GroupMembers";
import GroupMedia from "./pages/group/GroupMedia";
import GroupEvents from "./pages/group/GroupEvents";
import GroupInfo from "./pages/group/GroupInfo";
import GroupHome from "./pages/group/GroupHome";
import PostDetail from "./pages/PostDetail";
import UserDetailPage from "./pages/UserDetailPage";
import Friends from "./pages/friends";

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

const MainLayout = () => {
  const [sidebarWidth, setSidebarWidth] = useState('250px');
  const headerHeight = 0; 

  const handleSidebarToggle = () => {
    setSidebarWidth((prev) => (prev === '250px' ? '60px' : '250px'));
  };

  return (
    <div className="App">
      <Header onSidebarToggle={handleSidebarToggle} />
      <div style={{ height: `${headerHeight}px` }} aria-hidden="true" /> 
      <div className="d-flex flex-nowrap">
        <Sidebar style={{ width: sidebarWidth }} />
        <main className="flex-grow-1">
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
    <LanguageProvider>
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
              <Route path="/profile/:uid" element={user ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/user/:uid" element={user ? <UserDetailPage /> : <Navigate to="/login" />} />
              <Route path="/messenger" element={user ? <Messenger /> : <Navigate to="/login" />} />
              <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
              <Route path="/groups" element={user ? <Groups /> : <Navigate to="/login" />} />
              <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
              <Route path="/friends" element={user ? <Friends /> : <Navigate to="/login" />} />
              <Route path="/story" element={user ? <Storys /> : <Navigate to="/login" />} />
              <Route path="/playgame" element={user ? <PlayGame /> : <Navigate to="/login" />} />
              <Route path="/post/:postId" element={user ? <PostDetail /> : <Navigate to="/login" />} />
              {/* Group Page with nested routes */}

              <Route path="groups/:groupId" element={<GroupPage />}>
                <Route index element={<GroupHome />} />
                <Route path="members" element={<GroupMembers />} />
                <Route path="media" element={<GroupMedia />} />
                <Route path="events" element={<GroupEvents />} />
                <Route path="about" element={<GroupInfo />} />

                <Route path="*" element={<Navigate to="." replace />} />
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
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;