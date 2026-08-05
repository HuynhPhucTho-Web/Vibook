import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = "ViBook - Mạng xã hội chia sẻ & kết nối";
const DEFAULT_DESCRIPTION = "Chào mừng bạn đến với ViBook, nền tảng mạng xã hội kết nối bạn bè, chia sẻ câu chuyện, bài viết blog thú vị và mua sắm trực tuyến tiện lợi.";
const DEFAULT_IMAGE = "/images/default-share-cover.jpg";
const SITE_URL = window.location.origin;

export default function SEO({
  title,
  description,
  slug = "",
  image,
  type = "website",
  schema
}) {
  const metaTitle = title ? `${title} | ViBook` : DEFAULT_TITLE;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${SITE_URL}${slug}`;
  const metaImage = image || `${SITE_URL}${DEFAULT_IMAGE}`;

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="ViBook" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
