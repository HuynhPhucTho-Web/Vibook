import React, { useContext, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Youtube, 
  BookOpen, 
  UserCheck, 
  Globe, 
  Sun, 
  ChevronRight,
  Shield,
  Layers,
  Heart,
  Code2,
  Terminal,
  ExternalLink,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { FaGithub, FaLinkedin, FaFacebook } from 'react-icons/fa';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import ContentPolicy from '../components/about/ContentPolicy';
import BehavioralPolicy from '../components/about/BehavioralPolicy';
import PrivacyPolicy from '../components/about/PrivacyPolicy';
import OtherStandards from '../components/about/OtherStandards';

export default function AboutPage() {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isLight = theme === 'light';
  const [activePolicy, setActivePolicy] = useState(null);

  // Schema Markup Entity Graph (Person + Organization + ProfilePage) chuẩn hóa cho AI & Google
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://phucthodev.online';
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${origin}/#founder`,
        "name": "Huỳnh Phúc Thọ",
        "alternateName": ["Huynh Phuc Tho", "ThoDev"],
        "jobTitle": "Software Engineer & Web Developer",
        "url": `${origin}/about`,
        "image": `${origin}/images/logo1.png`,
        "description": "Huỳnh Phúc Thọ là một Software Engineer và Web Developer tại Việt Nam, tập trung vào phát triển website, web application, phần mềm và các sản phẩm công nghệ.",
        "sameAs": [
          "https://github.com/HuynhPhucTho-Web",
          "https://www.linkedin.com/in/huynh-phuc-065843210/",
          "https://www.facebook.com/huynh.tho.916917",
          "https://thodev-web-design-x212.vercel.app/"
        ],
        "knowsAbout": [
          "Frontend Web Development",
          "React và JavaScript",
          "Software Engineering",
          "Firebase và các dịch vụ Backend",
          "AI và ứng dụng AI",
          "UI/UX và Responsive Web Design",
          "Phát triển sản phẩm số"
        ],
        "worksFor": {
          "@type": "Organization",
          "@id": `${origin}/#organization`
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "thohpce181027@fpt.edu.vn",
          "contactType": "Technical and Developer Inquiries",
          "areaServed": "VN",
          "availableLanguage": ["Vietnamese", "English"]
        }
      },
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        "name": "ThoDev",
        "alternateName": "HuynhPhucThoWeb",
        "url": "https://thodev-web-design-x212.vercel.app/",
        "logo": `${origin}/images/logo1.png`,
        "founder": {
          "@type": "Person",
          "@id": `${origin}/#founder`
        },
        "sameAs": [
          "https://thodev-web-design-x212.vercel.app/",
          "https://github.com/HuynhPhucTho-Web",
          "https://www.linkedin.com/in/huynh-phuc-065843210/",
          "https://www.facebook.com/huynh.tho.916917"
        ],
        "description": "ThoDev là portfolio cá nhân và nền tảng mạng xã hội kết nối thế hệ mới tích hợp bảng tin, blog kỹ thuật, thương mại và các ứng dụng trí tuệ nhân tạo.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Cần Thơ",
          "addressCountry": "VN",
          "streetAddress": "Ấp 6 Ngàn, Tân Hòa"
        }
      },
      {
        "@type": "ProfilePage",
        "@id": `${origin}/about#webpage`,
        "url": `${origin}/about`,
        "name": "Giới thiệu & Thông Tin Nhà Sáng Lập Huỳnh Phúc Thọ | ThoDev",
        "mainEntity": {
          "@type": "Person",
          "@id": `${origin}/#founder`
        }
      }
    ]
  };

  const getPolicyComponent = () => {
    switch (activePolicy) {
      case 'content':
        return <ContentPolicy isLight={isLight} onBack={() => setActivePolicy(null)} />;
      case 'behavior':
        return <BehavioralPolicy isLight={isLight} onBack={() => setActivePolicy(null)} />;
      case 'privacy':
        return <PrivacyPolicy isLight={isLight} onBack={() => setActivePolicy(null)} />;
      case 'standards':
        return <OtherStandards isLight={isLight} onBack={() => setActivePolicy(null)} />;
      default:
        return null;
    }
  };

  const getHelmetData = () => {
    switch (activePolicy) {
      case 'content':
        return {
          title: "Chính Sách Nội Dung | ThoDev AdSense Compliance",
          desc: "Xem chi tiết quy định và chính sách nội dung trên mạng xã hội ThoDev để tuân thủ Google AdSense."
        };
      case 'behavior':
        return {
          title: "Chính Sách Về Hành Vi | ThoDev AdSense Compliance",
          desc: "Tìm hiểu chính sách về hành vi, click tặc và vị trí quảng cáo an toàn trên ThoDev."
        };
      case 'privacy':
        return {
          title: "Chính Sách Quyền Riêng Tư | ThoDev AdSense Compliance",
          desc: "Đọc về cơ chế thu thập dữ liệu người dùng và chính sách Cookie phân phối quảng cáo trên ThoDev."
        };
      case 'standards':
        return {
          title: "Các Yêu Cầu & Tiêu Chuẩn Khác | ThoDev AdSense Compliance",
          desc: "Các tiêu chuẩn kỹ thuật, thiết kế responsive và chất lượng nội dung trên ThoDev."
        };
      default:
        return {
          title: "Giới Thiệu Về ThoDev | Mạng Xã Hội Đa Tính Năng",
          desc: "Khám phá ThoDev - Mạng xã hội kết nối thế hệ mới tích hợp bảng tin, nhắn tin messenger, viết blog, chợ mua sắm trực tuyến, sự kiện và trò chơi giải trí."
        };
    }
  };

  const helmetData = getHelmetData();

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
      icon: Calendar,
      title: "Quản lý sự kiện (Events)",
      desc: "Tạo và tham gia các sự kiện trong cộng đồng. Lên lịch thời gian, địa điểm, theo dõi danh sách người tham gia và phòng chat riêng của sự kiện."
    },
    {
      icon: Youtube,
      title: "Trung tâm Video (Video Hub)",
      desc: "Khám phá thế giới qua các video clip sống động được chia sẻ từ cộng đồng thành viên ThoDev."
    },
    {
      icon: UserCheck,
      title: "Trang cá nhân & Cài đặt",
      desc: "Thể hiện cá tính qua trang cá nhân chi tiết bao gồm bài viết của bạn, bài viết đã chia sẻ, bài viết đã lưu và tùy chỉnh quyền riêng tư."
    }
  ];

  return (
    <>
      <Helmet>
        <title>{helmetData.title}</title>
        <meta name="description" content={helmetData.desc} />
        <link rel="canonical" href={`${window.location.origin}/about`} />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content={helmetData.title} />
        <meta property="og:description" content={helmetData.desc} />
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
        {activePolicy ? (
          <div className="py-2">
            {getPolicyComponent()}
          </div>
        ) : (
          <>
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
                Chào mừng bạn đến với ThoDev
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
                ThoDev là một nền tảng mạng xã hội tích hợp đa tính năng thế hệ mới, được thiết kế để xóa nhòa ranh giới giữa giao tiếp xã hội, chia sẻ tri thức và giao thương trực tuyến.
              </p>
            </header>

            {/* Giới thiệu Banner */}
            <div style={{ marginBottom: '4rem', overflow: 'hidden', borderRadius: '20px' }}>
              <img 
                src="/images/default-share-cover.jpg" 
                alt="Nền tảng mạng xã hội đa tính năng ThoDev" 
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
                  Hệ Sinh Thế Tính Năng Đầy Đủ
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

            {/* AdSense Compliance Section */}
            <section style={{ marginBottom: '5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h2 style={{
                  fontSize: '2.2rem',
                  fontWeight: '800',
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em'
                }}>
                  Chính Sách & Tiêu Chuẩn AdSense
                </h2>
                <p style={{ opacity: 0.75, maxWidth: '600px', margin: '0 auto' }}>
                  Thông tin công khai giải thích rõ cơ chế vận hành của ThoDev đáp ứng tiêu chuẩn đối tác của Google AdSense.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem'
              }}>
                {[
                  {
                    id: 'content',
                    title: 'Chính sách nội dung',
                    desc: 'Quy định bản quyền, chống spam và nội dung do người dùng tự tạo.',
                    icon: Shield,
                    path: '/content-policy'
                  },
                  {
                    id: 'behavior',
                    title: 'Chính sách về hành vi',
                    desc: 'Cam kết vị trí quảng cáo an toàn, ngăn chặn click ảo và điều hướng minh bạch.',
                    icon: Users,
                    path: '/terms-of-service'
                  },
                  {
                    id: 'privacy',
                    title: 'Chính sách quyền riêng tư',
                    desc: 'Minh bạch thu thập dữ liệu người dùng và chính sách Cookie Google AdSense.',
                    icon: Layers,
                    path: '/privacy-policy'
                  },
                  {
                    id: 'standards',
                    title: 'Yêu cầu & Tiêu chuẩn khác',
                    desc: 'Cấu trúc menu điều hướng rõ ràng, bài viết nguyên bản và độ mượt di động.',
                    icon: UserCheck,
                    path: '/other-standards'
                  }
                ].map((p) => {
                  const IconComp = p.icon;
                  return (
                    <Link
                      key={p.id}
                      to={p.path}
                      className="vb-glass feature-card no-underline"
                      style={{
                        padding: '2rem',
                        borderRadius: '18px',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                        background: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                        color: 'inherit',
                        textDecoration: 'none'
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
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: 'inherit' }}>
                        {p.title}
                      </h3>
                      <p style={{ opacity: 0.75, fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                        {p.desc}
                      </p>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#8e54e9', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto' }}>
                        Đọc chi tiết <ChevronRight size={14} />
                      </span>
                    </Link>
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

            {/* Contact Info & Founder Profile (Streamlined GEO Optimized) */}
            <section 
              id="founder-info"
              className="vb-glass" 
              style={{
                padding: '3rem 2rem',
                borderRadius: '24px',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                background: isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.02)',
                marginBottom: '4rem',
              }}
            >
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#8e54e9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.5rem'
                }}>
                  <Sparkles size={16} /> Người Sáng Lập & Kỹ Sư Phát Triển
                </span>
                <h2 style={{
                  fontSize: '2.2rem',
                  fontWeight: '800',
                  marginBottom: '0.5rem',
                  background: 'linear-gradient(135deg, #8e54e9 0%, #4776e6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.01em'
                }}>
                  Huỳnh Phúc Thọ – Software Engineer & Web Developer
                </h2>
                <p style={{
                  fontSize: '1rem',
                  opacity: 0.85,
                  maxWidth: '750px',
                  margin: '0 auto',
                  lineHeight: '1.75'
                }}>
                  Xin chào, tôi là <strong>Huỳnh Phúc Thọ</strong>, một Software Engineer và Web Developer tại Việt Nam, đồng thời là nhà sáng lập và kiến trúc sư hệ thống của nền tảng <strong>ThoDev</strong> (phucthodev.online). Tôi tập trung vào việc biến ý tưởng thành các sản phẩm số có giao diện hiện đại, trải nghiệm mượt mà và khả năng mở rộng cao.
                </p>
              </div>

              {/* 1. Tôi làm gì? (Chuyên môn cốt lõi) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: isLight ? '#1e293b' : '#f8fafc'
                }}>
                  <Code2 size={20} color="#8e54e9" /> Tôi làm gì?
                </h3>
                <p style={{ marginBottom: '1rem', opacity: 0.85, fontSize: '0.95rem' }}>
                  Tập trung vào <strong>Web Development, Software Engineering, AI và Digital Products</strong>, ứng dụng công nghệ hiện đại vào thực tế:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {[
                    "Frontend Web Development",
                    "React và JavaScript",
                    "Software Engineering",
                    "Firebase và các dịch vụ Backend",
                    "AI và ứng dụng AI",
                    "UI/UX và Responsive Web Design",
                    "Phát triển sản phẩm số"
                  ].map((field, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.85rem 1.1rem',
                        borderRadius: '12px',
                        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.92rem',
                        fontWeight: '600'
                      }}
                    >
                      <CheckCircle2 size={16} color="#8e54e9" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Bảng Thông Số Thực Thể & Vận Hành (E-E-A-T Specifications) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  marginBottom: '0.85rem',
                  color: isLight ? '#1e293b' : '#f8fafc'
                }}>
                  Thông Tin Vận Hành & Năng Lực
                </h3>
                <div style={{ overflowX: 'auto', borderRadius: '14px', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}` }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.92rem',
                    textAlign: 'left'
                  }}>
                    <thead>
                      <tr style={{ background: isLight ? 'rgba(142, 84, 233, 0.08)' : 'rgba(142, 84, 233, 0.2)' }}>
                        <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', width: '32%' }}>Tiêu chí</th>
                        <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Thông tin chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "Họ và tên", val: "Huỳnh Phúc Thọ (Huynh Phuc Tho)" },
                        { key: "Chuyên môn chính", val: "Software Engineer & Web Developer" },
                        { key: "Vai trò", val: "Nhà sáng lập (Founder) & Kỹ sư phát triển nền tảng ThoDev" },
                        { key: "Công nghệ cốt lõi", val: "React 19, JavaScript ES6+, Vite, Firebase Firestore, Node.js, AI Integration" },
                        { key: "Đơn vị vận hành", val: "ThoDev - HuynhPhucThoWeb (Ấp 6 Ngàn, Tân Hòa, TP Cần Thơ, Việt Nam)" },
                        { key: "Email liên hệ chính thức", val: "thohpce181027@fpt.edu.vn (Hỗ trợ Thứ 2 - Thứ 6, 8:00 - 17:30)" }
                      ].map((row, idx) => (
                        <tr 
                          key={idx}
                          style={{
                            borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                            background: idx % 2 === 0 ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.01)') : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem 1.25rem', fontWeight: '600', color: isLight ? '#475569' : '#cbd5e1' }}>
                            {row.key}
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            {row.val}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Khám phá ThoDev & Kênh Liên Kết Trực Tiếp (Không lặp lại) */}
              <div style={{
                padding: '2rem 1.75rem',
                borderRadius: '16px',
                background: isLight ? 'rgba(142, 84, 233, 0.04)' : 'rgba(142, 84, 233, 0.08)',
                border: `1px solid ${isLight ? 'rgba(142, 84, 233, 0.2)' : 'rgba(168, 85, 247, 0.3)'}`,
                textAlign: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Khám phá ThoDev & Kết Nối Trực Tiếp
                </h3>
                <p style={{ opacity: 0.85, fontSize: '0.95rem', maxWidth: '650px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  Tìm hiểu thêm về <strong>Huỳnh Phúc Thọ</strong>, xem các dự án đã thực hiện và khám phá những sản phẩm công nghệ đang được phát triển qua các kênh chính thức:
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.85rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Button 1: Đơn Vị Vận Hành */}
                  <a 
                    href="https://thodev-web-design-x212.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #8e54e9 0%, #4776e6 100%)',
                      color: '#fff',
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 14px rgba(142, 84, 233, 0.3)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    <ExternalLink size={16} /> Đơn Vị Vận Hành
                  </a>

                  {/* Button 2: GitHub */}
                  <a 
                    href="https://github.com/HuynhPhucTho-Web" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      background: isLight ? '#0f172a' : '#1e293b',
                      color: '#fff',
                      border: `1px solid ${isLight ? '#0f172a' : '#334155'}`,
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <FaGithub size={17} /> GitHub
                  </a>

                  {/* Button 3: LinkedIn */}
                  <a 
                    href="https://www.linkedin.com/in/huynh-phuc-065843210/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      background: '#0a66c2',
                      color: '#fff',
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 12px rgba(10, 102, 194, 0.25)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <FaLinkedin size={17} /> LinkedIn
                  </a>

                  {/* Button 4: Facebook */}
                  <a 
                    href="https://www.facebook.com/huynh.tho.916917" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      background: '#1877f2',
                      color: '#fff',
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 12px rgba(24, 119, 242, 0.25)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <FaFacebook size={17} /> Facebook
                  </a>

                  {/* Button 5: Email */}
                  <a 
                    href="mailto:thohpce181027@fpt.edu.vn" 
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                      color: isLight ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}`,
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <Mail size={16} /> thohpce181027@fpt.edu.vn
                  </a>
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
                Bắt Đầu Khám Phá ThoDev Ngay Hôm Nay!
              </h2>
              <p style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.05rem' }}>
                Đăng ký tài khoản miễn phí để chia sẻ những khoảnh khắc đẹp của cuộc sống và tận hưởng các tiện ích đỉnh cao.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  to="/feed" 
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
          </>
        )}
      </main>
    </>
  );
}

export function PrivacyPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === 'light';
  return (
    <div className="page-shell" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <Helmet>
        <title>Chính Sách Quyền Riêng Tư | ThoDev</title>
        <meta name="description" content="Đọc về cơ chế thu thập dữ liệu người dùng và chính sách Cookie phân phối quảng cáo trên ThoDev." />
      </Helmet>
      <PrivacyPolicy isLight={isLight} onBack={() => window.history.back()} />
    </div>
  );
}

export function TermsOfServicePage() {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === 'light';
  return (
    <div className="page-shell" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <Helmet>
        <title>Chính Sách Về Hành Vi & Điều Khoản | ThoDev</title>
        <meta name="description" content="Tìm hiểu chính sách về hành vi, click tặc và vị trí quảng cáo an toàn trên ThoDev." />
      </Helmet>
      <BehavioralPolicy isLight={isLight} onBack={() => window.history.back()} />
    </div>
  );
}

export function ContentPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === 'light';
  return (
    <div className="page-shell" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <Helmet>
        <title>Chính Sách Nội Dung | ThoDev</title>
        <meta name="description" content="Xem chi tiết quy định và chính sách nội dung trên mạng xã hội ThoDev để tuân thủ Google AdSense." />
      </Helmet>
      <ContentPolicy isLight={isLight} onBack={() => window.history.back()} />
    </div>
  );
}

export function OtherStandardsPage() {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === 'light';
  return (
    <div className="page-shell" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <Helmet>
        <title>Các Yêu Cầu & Tiêu Chuẩn Khác | ThoDev</title>
        <meta name="description" content="Các tiêu chuẩn kỹ thuật, thiết kế responsive và chất lượng nội dung trên ThoDev." />
      </Helmet>
      <OtherStandards isLight={isLight} onBack={() => window.history.back()} />
    </div>
  );
}