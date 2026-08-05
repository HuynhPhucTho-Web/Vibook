import React, { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  ShoppingBag, 
  Calendar, 
  Youtube, 
  Gamepad2, 
  BookOpen, 
  UserCheck, 
  Globe, 
  Sun, 
  ChevronRight,
  Shield,
  Layers,
  Heart
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';

export default function AboutPage() {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isLight = theme === 'light';

  // Schema Markup Organization cho ViBook
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ViBook",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo.png`,
    "description": "Mạng xã hội tích hợp kết nối bạn bè, chia sẻ bài viết blog, trò chuyện trực tuyến và mua sắm thông minh.",
    "sameAs": [
      "https://github.com/huynhphuctho",
      "https://facebook.com/vibook.platform"
    ]
  };

  const features = [
    {
      icon: Users,
      title: "Bảng tin & Kết nối (Feed)",
      desc: "Chia sẻ khoảnh khắc, hình ảnh, video với bạn bè. Bày tỏ cảm xúc đa dạng (Thích, Yêu thích, Haha, Wow, Buồn, Phẫn nộ) và bình luận tương tác thời gian thực."
    },
    {
      icon: BookOpen,
      title: "Blog & Tin tức (Newsroom)",
      desc: "Nền tảng xuất bản bài viết chuyên nghiệp. Đọc, viết bài, gắn thẻ (tag), phân loại danh mục, tính thời gian đọc và lưu bài viết yêu thích."
    },
    {
      icon: MessageCircle,
      title: "Trò chuyện tức thời (Messenger)",
      desc: "Hệ thống nhắn tin thời gian thực mượt mà với bạn bè. Gửi tin nhắn, chia sẻ icon cảm xúc trực quan và bảo mật."
    },
    {
      icon: ShoppingBag,
      title: "Chợ mua sắm (Marketplace)",
      desc: "Cửa hàng trực tuyến tích hợp. Duyệt sản phẩm, thêm vào giỏ hàng, đặt hàng, quản lý đơn hàng và kênh dành riêng cho người bán (Seller Dashboard)."
    },
    {
      icon: Calendar,
      title: "Quản lý sự kiện (Events)",
      desc: "Tạo và tham gia các sự kiện trong cộng đồng. Lên lịch thời gian, địa điểm, theo dõi danh sách người tham gia và phòng chat riêng của sự kiện."
    },
    {
      icon: Youtube,
      title: "Trung tâm Video (Video Hub)",
      desc: "Khám phá thế giới qua các video clip sống động được chia sẻ từ cộng đồng thành viên ViBook."
    },
    {
      icon: Gamepad2,
      title: "Kho Trò chơi (Play Game)",
      desc: "Giải trí trực tuyến ngay trên nền tảng với danh sách trò chơi HTML5 phong phú, chơi ngay không cần cài đặt."
    },
    {
      icon: UserCheck,
      title: "Trang cá nhân & Cài đặt",
      desc: "Thể hiện cá tính qua trang cá nhân chi tiết bao gồm Tin bài (Story), bài viết của bạn, bài viết đã chia sẻ, đã lưu và tùy chỉnh quyền riêng tư."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Giới Thiệu Về ViBook | Mạng Xã Hội Đa Tính Năng</title>
        <meta 
          name="description" 
          content="Khám phá ViBook - Mạng xã hội kết nối thế hệ mới tích hợp bảng tin, nhắn tin messenger, viết blog, chợ mua sắm trực tuyến, sự kiện và trò chơi giải trí." 
        />
        <link rel="canonical" href={`${window.location.origin}/about`} />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Giới Thiệu Về ViBook | Mạng Xã Hội Đa Tính Năng" />
        <meta property="og:description" content="Kết nối bạn bè, chia sẻ cuộc sống, mua sắm tiện lợi và giải trí không giới hạn trên ViBook." />
        <meta property="og:image" content={`${window.location.origin}/images/default-share-cover.jpg`} />
        <meta property="og:type" content="website" />

        {/* Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <main className="about-page-shell" style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        color: isLight ? '#1e293b' : '#f1f5f9',
        fontFamily: 'var(--vb-font-sans, system-ui, sans-serif)',
        lineHeight: '1.7'
      }}>
        {/* Hero Section */}
        <header style={{
          textAlign: 'center',
          marginBottom: '4rem',
          padding: '2.5rem',
          borderRadius: '24px',
          background: isLight 
            ? 'linear-gradient(135deg, rgba(142, 84, 233, 0.05) 0%, rgba(71, 118, 230, 0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(142, 84, 233, 0.1) 0%, rgba(71, 118, 230, 0.1) 100%)',
          border: `1px solid ${isLight ? 'rgba(142, 84, 233, 0.15)' : 'rgba(168, 85, 247, 0.2)'}`,
          boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.02)' : '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#8e54e9',
            display: 'inline-block',
            marginBottom: '0.75rem'
          }}>
            Chào mừng bạn đến với ViBook
          </span>
          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #8e54e9 0%, #4776e6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Kết Nối, Chia Sẻ & Trải Nghiệm
          </h1>
          <p style={{
            fontSize: '1.15rem',
            opacity: 0.85,
            maxWidth: '700px',
            margin: '0 auto',
            fontWeight: '400'
          }}>
            ViBook là một nền tảng mạng xã hội tích hợp đa tính năng thế hệ mới, được thiết kế để xóa nhòa ranh giới giữa giao tiếp xã hội, chia sẻ tri thức và giao thương trực tuyến.
          </p>
        </header>

        {/* Giới thiệu Banner */}
        <div style={{ marginBottom: '4rem', overflow: 'hidden', borderRadius: '20px' }}>
          <img 
            src="/images/default-share-cover.jpg" 
            alt="Nền tảng mạng xã hội đa tính năng ViBook" 
            loading="lazy" 
            width="1000" 
            height="400" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: '380px',
              objectFit: 'cover',
              borderRadius: '20px',
              transition: 'transform 0.5s ease',
              display: 'block'
            }}
            onError={(e) => {
              // Dự phòng nếu không load được banner mặc định
              e.target.src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80";
            }}
          />
        </div>

        {/* Tầm nhìn & Sứ mệnh */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2.5rem',
          marginBottom: '5rem'
        }}>
          <div className="vb-glass" style={{
            padding: '2.5rem',
            borderRadius: '20px',
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
            background: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.02)'
          }}>
            <h2 style={{
              fontSize: '1.45rem',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#8e54e9'
            }}>
              <Shield size={24} /> Tầm Nhìn
            </h2>
            <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>
              Trở thành một hệ sinh thái số toàn diện, nơi mọi người dùng có thể thực hiện mọi hoạt động thiết yếu hàng ngày từ trò chuyện, giải trí cho đến mua sắm và làm việc mà không cần phải rời khỏi ứng dụng.
            </p>
          </div>

          <div className="vb-glass" style={{
            padding: '2.5rem',
            borderRadius: '20px',
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
            background: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.02)'
          }}>
            <h2 style={{
              fontSize: '1.45rem',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#4776e6'
            }}>
              <Layers size={24} /> Sứ Mệnh
            </h2>
            <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>
              Kiến tạo một không gian mạng văn minh, tốc độ cao, hỗ trợ trải nghiệm người dùng tuyệt vời nhờ công nghệ hiển thị kính mờ (Glassmorphism) sang trọng và khả năng cá nhân hóa giao diện tối đa theo sở thích cá nhân.
            </p>
          </div>
        </section>

        {/* Hệ sinh thái tính năng */}
        <section style={{ marginBottom: '5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: '800',
              marginBottom: '0.75rem',
              letterSpacing: '-0.01em'
            }}>
              Hệ Sinh Thái Tính Năng Đầy Đủ
            </h2>
            <p style={{ opacity: 0.75, maxWidth: '600px', margin: '0 auto' }}>
              Khám phá bộ công cụ mạnh mẽ hỗ trợ bạn tương tác xã hội và thực hiện giao dịch mỗi ngày.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {features.map((f, idx) => {
              const IconComp = f.icon;
              return (
                <div 
                  key={idx} 
                  className="vb-glass feature-card" 
                  style={{
                    padding: '2rem',
                    borderRadius: '18px',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                    background: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(142, 84, 233, 0.1) 0%, rgba(71, 118, 230, 0.1) 100%)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#8e54e9'
                  }}>
                    <IconComp size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                    {f.title}
                  </h3>
                  <p style={{ opacity: 0.75, fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Thiết kế tối ưu */}
        <section className="vb-glass" style={{
          padding: '3rem 2.5rem',
          borderRadius: '24px',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
          background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.02)',
          marginBottom: '5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '800',
            textAlign: 'center',
            margin: 0
          }}>
            Tối Ưu Trải Nghiệm & Công Nghệ
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Sun style={{ color: '#f59e0b', marginBottom: '0.75rem' }} size={32} />
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Giao Diện Thích Ứng</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0 }}>
                Hỗ trợ chế độ Sáng/Tối và đổi màu nền đa dạng (Mint, Warm, Lavender, Sky) giúp bảo vệ thị lực.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Globe style={{ color: '#3b82f6', marginBottom: '0.75rem' }} size={32} />
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Song Ngữ Linh Hoạt</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0 }}>
                Dễ dàng chuyển đổi ngôn ngữ Tiếng Việt và Tiếng Anh tức thì để kết nối với người dùng quốc tế.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Heart style={{ color: '#ef4444', marginBottom: '0.75rem' }} size={32} />
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Hiệu Ứng Mượt Mà</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0 }}>
                Công nghệ Framer Motion mang đến chuyển động mượt, có tùy chọn giảm chuyển động (Reduced Motion) tiết kiệm pin.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #8e54e9 0%, #4776e6 100%)',
          color: '#fff',
          boxShadow: '0 15px 35px rgba(142, 84, 233, 0.25)'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>
            Bắt Đầu Khám Phá ViBook Ngay Hôm Nay!
          </h2>
          <p style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.05rem' }}>
            Đăng ký tài khoản miễn phí để chia sẻ những khoảnh khắc đẹp của cuộc sống và tận hưởng các tiện ích đỉnh cao.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/homevibook" 
              style={{
                padding: '0.85rem 2rem',
                backgroundColor: '#fff',
                color: '#8e54e9',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s ease'
              }}
            >
              Vào Bảng Tin <ChevronRight size={16} />
            </Link>
            <Link 
              to="/blog" 
              style={{
                padding: '0.85rem 2rem',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.95rem',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s ease'
              }}
            >
              Đọc Tin Tức
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}