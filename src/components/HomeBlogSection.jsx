import React, { useState, useEffect } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { BlogPromoStrip } from "./PostItem";
import staticBlogData from "../../Staticblogposts.json";

export default function HomeBlogSection({ theme }) {
  const [blogPromos, setBlogPromos] = useState(() => {
    try {
      const cached = localStorage.getItem("vibook_home_blog_promos");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map((item) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }));
      }
      return [];
    } catch (e) {
      console.error("Error reading cached blogs", e);
      return [];
    }
  });
  const [isBlogsLoading, setIsBlogsLoading] = useState(blogPromos.length === 0);
  const [blogLimit, setBlogLimit] = useState(5);

  useEffect(() => {
    let cancelled = false;
    const fetchBlogPromos = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "BlogPosts"), orderBy("createdAt", "desc"), limit(blogLimit)),
        );
        const blogs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate() : docSnap.data().createdAt,
          favoriteCount: docSnap.data().favoriteCount || 0,
          views: docSnap.data().views || 0,
        }));
        if (!cancelled) {
          const staticBlogs = (staticBlogData.posts || []).slice(0, blogLimit).map((post) => ({
            ...post,
            content: Array.isArray(post.content) ? post.content.join("") : (post.content || ""),
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            isStatic: true,
            favoriteCount: post.favoriteCount || 0,
            views: post.views || 0,
          }));
          
          const mergedBlogs = [...staticBlogs];
          blogs.forEach((blog) => {
            const key = blog.slug || blog.id || blog.title;
            const exists = mergedBlogs.some((item) => (item.slug || item.id || item.title) === key);
            if (!exists) {
              mergedBlogs.push(blog);
            }
          });

          // Fetch actual favorite counts from FavoriteBlogs
          try {
            const blogIds = mergedBlogs.map((b) => b.id).filter(Boolean);
            const countsMap = {};
            if (blogIds.length > 0) {
              const favsSnapshot = await getDocs(
                query(collection(db, "FavoriteBlogs"), where("blogId", "in", blogIds))
              );
              favsSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (data.blogId) {
                  countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
                }
              });
            }
            mergedBlogs.forEach((p) => {
              const key = p.id;
              p.favoriteCount = countsMap[key] || 0;
            });
          } catch (favErr) {
            console.error("Error loading promo favorite counts", favErr);
          }

          // Đẩy những blog mới nhất lên trên cùng (Sort by Date Descending)
          mergedBlogs.sort((a, b) => b.createdAt - a.createdAt);

          try {
            localStorage.setItem("vibook_home_blog_promos", JSON.stringify(mergedBlogs));
          } catch (e) {
            console.error("Error caching blogs", e);
          }

          setBlogPromos(mergedBlogs);
          setIsBlogsLoading(false);
        }
      } catch (error) {
        console.error("Blog promo load error", error);
        if (!cancelled) {
          let staticBlogs = (staticBlogData.posts || []).slice(0, blogLimit).map((post) => ({
            ...post,
            content: Array.isArray(post.content) ? post.content.join("") : (post.content || ""),
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            isStatic: true,
            favoriteCount: post.favoriteCount || 0,
            views: post.views || 0,
          }));

          // Fetch actual favorite counts for fallback
          try {
            const blogIds = staticBlogs.map((b) => b.id).filter(Boolean);
            const countsMap = {};
            if (blogIds.length > 0) {
              const favsSnapshot = await getDocs(
                query(collection(db, "FavoriteBlogs"), where("blogId", "in", blogIds))
              );
              favsSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (data.blogId) {
                  countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
                }
              });
            }
            staticBlogs = staticBlogs.map(p => ({
              ...p,
              favoriteCount: countsMap[p.id] || 0
            }));
          } catch (favErr) {
            console.error("Error loading static fallback favorite counts", favErr);
          }

          // Sort fallback descending as well
          staticBlogs.sort((a, b) => b.createdAt - a.createdAt);

          setBlogPromos(staticBlogs);
          setIsBlogsLoading(false);
        }
      }
    };

    fetchBlogPromos();
    return () => {
      cancelled = true;
    };
  }, [blogLimit]);

  if (isBlogsLoading) {
    return <BlogPromoStrip loading={true} isLight={theme === "light"} title="Blog nổi bật" />;
  }

  if (blogPromos.length === 0) {
    return null;
  }

  return (
    <BlogPromoStrip
      blogs={blogPromos}
      isLight={theme === "light"}
      title="Blog nổi bật"
      onLoadMore={() => setBlogLimit((prev) => prev + 5)}
    />
  );
}
