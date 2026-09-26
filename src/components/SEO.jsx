import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = "ThoDev - Mạng xã hội chia sẻ & kết nối";
const DEFAULT_DESCRIPTION = "Chào mừng bạn đến với ThoDev, nền tảng công nghệ và mạng xã hội sáng tạo bởi Huỳnh Phúc Thọ (Software Engineer & Web Developer). Chia sẻ bài viết blog công nghệ, kết nối bạn bè và mua sắm trực tuyến.";
const DEFAULT_IMAGE = "/images/default-share-cover.jpg";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://phucthodev.online";

export default function SEO({
  title,
  description,
  slug = "",
  image,
  type = "website",
  schema,
  noindex = false,
  author = "Huỳnh Phúc Thọ"
}) {
  const metaTitle = title ? `${title} | ThoDev` : DEFAULT_TITLE;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${SITE_URL}${slug}`;
  const metaImage = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : `${SITE_URL}${DEFAULT_IMAGE}`;

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="author" content={author} />
      <meta name="creator" content={author} />
      <meta name="publisher" content="ThoDev" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="author" href={`${SITE_URL}/about`} />

      {/* Robots & AI Crawlers */}
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="ThoDev" />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:creator" content="@huynhphuctho" />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
