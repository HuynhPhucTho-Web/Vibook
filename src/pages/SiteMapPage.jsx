import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function ViBookSitemap() {
  // Cấu trúc danh mục và liên kết theo mô hình ứng dụng ViBook
  const sitemapSections = [
    {
      title: 'Điều Hướng Chính',
      icon: '📌',
      links: [
        { name: 'Trang Chủ ViBook', path: '/' },
        { name: 'Tất Cả Bài Viết / Sách', path: '/posts' },
        { name: 'Giới Thiệu ViBook', path: '/about' },
        { name: 'Liên Hệ & Hỗ Trợ', path: '/contact' },
      ],
    },
    {
      title: 'Lập Trình C++ & Game',
      icon: '💻',
      links: [
        { name: 'Học Lập Trình C++ Cơ Bản Từ Đô', path: '/blog/hoc-c-plus-plus-co-ban' },
        { name: 'Tại Sao Nên Chọn C++ Để Bắt Đầu?', path: '/blog/tai-sao-nen-hoc-c-plus-plus' },
        { name: 'Hướng Dẫn Lập Trình Game 2D Với C++', path: '/blog/lap-trinh-game-voi-c-plus-plus' },
      ],
    },
    {
      title: 'React & Frontend Core',
      icon: '⚛️',
      links: [
        { name: 'Tự Học React Hooks: useState & useEffect', path: '/blog/tu-hoc-react-hooks-usestate-useeffect' },
        { name: 'Lộ Trình Học ReactJS Chuẩn Cho Lập Trình Viên', path: '/blog/lo-trinh-hoc-reactjs' },
      ],
    },
    {
      title: 'Node.js & Backend Architecture',
      icon: '🟢',
      links: [
        { name: 'Xây Dựng RESTful API Chuẩn Với Express', path: '/blog/xay-dung-rest-api-nodejs-express' },
        { name: 'Hướng Dẫn Kết Nối & Tối Ưu MongoDB', path: '/blog/ket-noi-nodejs-voi-mongodb' },
      ],
    },
    {
      title: 'TypeScript & DevOps',
      icon: '🛠️',
      links: [
        { name: 'Nắm Vững TypeScript Trong 30 Phút', path: '/blog/typescript-cho-nguoi-moi' },
        { name: 'Docker Cơ Bản Dành Cho Lập Trình Viên', path: '/blog/docker-co-ban' },
        { name: 'Triển Khai Đa Service Với Docker Compose', path: '/blog/cach-dung-docker-compose' },
      ],
    },
    {
      title: 'AI, Machine Learning & Security',
      icon: '🔒',
      links: [
        { name: 'Nhập Môn Machine Learning Cho Người Mới', path: '/blog/nhap-mon-machine-learning' },
        { name: 'Bảo Mật Web: Phòng Chống Lỗ Hổng XSS & CSRF', path: '/blog/bao-mat-web-xss-csrf' },
      ],
    },
  ];

  // Schema Markup cho Google Search Engine
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ViBook Sitemap",
    "description": "Danh mục tổng hợp toàn bộ tài liệu, khóa học và bài viết công nghệ trên ViBook",
    "url": "https://vibook-6409f.firebaseapp.com/sitemap"
  };

  return (
    <>
      <Helmet>
        <title>Sơ Đồ Trang Web (Sitemap) | ViBook</title>
        <meta 
          name="description" 
          content="Sơ đồ trang web ViBook. Tìm kiếm dễ dàng tất cả tài liệu lập trình C++, React, Node.js, TypeScript, Docker và Bảo mật web." 
        />
        <link rel="canonical" href="https://vibook-6409f.firebaseapp.com/sitemap" />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '3rem 1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <main style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Header Trang */}
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ backgroundColor: '#feefe8', color: '#f97316', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: '600', fontSize: '0.875rem' }}>
              ViBook Navigation
            </span>
            <h1 style={{ fontSize: '2.5rem', color: '#0f172a', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: '800' }}>
              Sơ Đồ Trang Web (Sitemap)
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
              Tra cứu nhanh toàn bộ kiến thức, tài liệu và lộ trình lập trình có trên ViBook.
            </p>
          </header>

          {/* Grid hiển thị danh mục bài viết */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {sitemapSections.map((section, idx) => (
              <section 
                key={idx} 
                style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  padding: '1.5rem', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  border: '1px solid #e2e8f0' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{section.icon}</span>
                  <h2 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', margin: 0 }}>
                    {section.title}
                  </h2>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx} style={{ marginBottom: '0.75rem' }}>
                      <Link 
                        to={link.path}
                        style={{ 
                          color: '#334155', 
                          textDecoration: 'none', 
                          fontSize: '0.95rem',
                          display: 'inline-block',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#f97316'}
                        onMouseOut={(e) => e.target.style.color = '#334155'}
                      >
                        • {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

        </main>
      </div>
    </>
  );
}