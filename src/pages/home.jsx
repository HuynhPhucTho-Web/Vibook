import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ThemeContext } from '../contexts/ThemeContext';

const Home = () => {
  const { theme, themes } = useContext(ThemeContext);
  const [postContent, setPostContent] = useState('');

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (postContent.trim()) {
      console.log('Posting:', postContent);
      setPostContent('');
    }
  };

  return (
    <div className={`min-vh-100 ${themes[theme]}`}>
      {/* News Feed */}
      <section>
        {/* Post Creation */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <form onSubmit={handlePostSubmit}>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="form-control mb-3"
                rows="4"
              ></textarea>
              <div className="d-flex justify-content-between">
                <div className="d-flex">
                  <button type="button" className="btn btn-link text-primary me-2">Photo/Video</button>
                  <button type="button" className="btn btn-link text-primary">Feeling/Activity</button>
                </div>
                <button type="submit" className="btn btn-primary">Post</button>
              </div>
            </form>
          </div>
        </div>
        {/* Sample Post */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle bg-secondary-subtle" style={{ width: '40px', height: '40px' }}></div>
              <div className="ms-2">
                <p className="mb-0 fw-bold">John Doe</p>
                <small className="text-muted">1 hour ago</small>
              </div>
            </div>
            <p>Welcome to ViBook! Today is a great day!</p>
            <div className="d-flex justify-content-between text-muted">
              <button className="btn btn-link text-muted p-0">Like</button>
              <button className="btn btn-link text-muted p-0">Comment</button>
              <button className="btn btn-link text-muted p-0">Share</button>
            </div>
          </div>
        </div>
      </section>
      {/* Right Sidebar (Business Tools) */}
      <aside className="mt-4 mt-lg-0">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">Business Tools</h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <Link to="/page-management" className="text-decoration-none text-dark">
                  Page Management
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/inbox" className="text-decoration-none text-dark">
                  Inbox
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/insights" className="text-decoration-none text-dark">
                  Insights
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/comment-management" className="text-decoration-none text-dark">
                  Comment Management
                </Link>
              </li>
              <li className="list-group-item">
                <Link to="/fan-badges" className="text-decoration-none text-dark">
                  Fan Badges
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;