import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://phucthodev.online';
const PROJECT_ID = 'vibook-6409f';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper to fetch all documents from a Firestore collection using REST API
async function fetchCollection(collectionName, maxDocs = null) {
  const documents = [];
  let pageToken = '';
  
  try {
    do {
      let url = `${FIRESTORE_BASE_URL}/${collectionName}?pageSize=100`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[Sitemap] Warning: Failed to fetch ${collectionName} (${res.status} ${res.statusText})`);
        break;
      }
      
      const data = await res.json();
      if (data.documents) {
        documents.push(...data.documents);
      }
      
      pageToken = data.nextPageToken;
      
      // Stop if we have reached our safety cap
      if (maxDocs && documents.length >= maxDocs) {
        return documents.slice(0, maxDocs);
      }
    } while (pageToken);
  } catch (error) {
    console.error(`[Sitemap] Error fetching collection ${collectionName}:`, error.message);
  }
  
  return documents;
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

async function generate() {
  console.log('[Sitemap] Starting sitemap generation...');
  const urls = [];

  // 1. Add Static Routes
  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/feed', priority: '1.0', changefreq: 'daily' },
    { path: '/blog', priority: '0.9', changefreq: 'daily' },
    { path: '/market', priority: '0.9', changefreq: 'daily' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.7', changefreq: 'monthly' },
    { path: '/terms-of-service', priority: '0.7', changefreq: 'monthly' },
    { path: '/content-policy', priority: '0.7', changefreq: 'monthly' },
    { path: '/other-standards', priority: '0.7', changefreq: 'monthly' },
    { path: '/groups', priority: '0.8', changefreq: 'daily' },
    { path: '/events', priority: '0.7', changefreq: 'daily' },
    { path: '/story', priority: '0.7', changefreq: 'daily' },
    { path: '/playgame', priority: '0.6', changefreq: 'monthly' },
    { path: '/videos', priority: '0.8', changefreq: 'daily' },
    { path: '/friends', priority: '0.7', changefreq: 'weekly' },
    { path: '/source', priority: '0.7', changefreq: 'weekly' }
  ];

  const currentDateStr = formatDate(new Date());

  for (const route of staticRoutes) {
    urls.push({
      loc: `${BASE_URL}${route.path}`,
      lastmod: currentDateStr,
      changefreq: route.changefreq,
      priority: route.priority
    });
  }

  // 2. Add Source Subjects (Dynamic scanned from directory)
  try {
    const sourceDataDir = path.join(__dirname, '../src/pages/source/data');
    if (fs.existsSync(sourceDataDir)) {
      const files = fs.readdirSync(sourceDataDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const subjectCode = file.replace('.js', '').toLowerCase();
          urls.push({
            loc: `${BASE_URL}/source/${subjectCode}`,
            lastmod: currentDateStr,
            changefreq: 'monthly',
            priority: '0.6'
          });
        }
      }
      console.log(`[Sitemap] Added ${files.filter(f => f.endsWith('.js')).length} subject code routes.`);
    }
  } catch (err) {
    console.warn('[Sitemap] Failed to read source subject directories:', err.message);
  }

  // 3. Add Static Blog Posts from Staticblogposts.json
  try {
    const staticBlogsPath = path.join(__dirname, '../Staticblogposts.json');
    if (fs.existsSync(staticBlogsPath)) {
      const rawData = fs.readFileSync(staticBlogsPath, 'utf8');
      const parsed = JSON.parse(rawData);
      if (parsed.posts && Array.isArray(parsed.posts)) {
        for (const post of parsed.posts) {
          if (post.slug && post.published !== false) {
            urls.push({
              loc: `${BASE_URL}/blog/${post.slug}`,
              lastmod: formatDate(post.updatedAt || post.createdAt || new Date()),
              changefreq: 'monthly',
              priority: '0.8'
            });
          }
        }
        console.log(`[Sitemap] Added ${parsed.posts.length} static blog posts.`);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] Failed to parse static blog posts:', err.message);
  }

  // 4. Fetch Dynamic Blog Posts from Firestore
  console.log('[Sitemap] Fetching dynamic BlogPosts from Firestore...');
  const dbBlogs = await fetchCollection('BlogPosts');
  let dbBlogCount = 0;
  for (const doc of dbBlogs) {
    const fields = doc.fields || {};
    const slug = fields.slug?.stringValue;
    const published = fields.published?.booleanValue ?? true; // assume published if not explicitly set
    
    if (slug && published) {
      const updatedAt = fields.updatedAt?.timestampValue || fields.createdAt?.timestampValue || new Date();
      urls.push({
        loc: `${BASE_URL}/blog/${slug}`,
        lastmod: formatDate(updatedAt),
        changefreq: 'weekly',
        priority: '0.8'
      });
      dbBlogCount++;
    }
  }
  console.log(`[Sitemap] Added ${dbBlogCount} dynamic blog posts.`);

  // 5. Fetch Products from Firestore
  console.log('[Sitemap] Fetching Products from Firestore...');
  const dbProducts = await fetchCollection('Products');
  let productCount = 0;
  for (const doc of dbProducts) {
    const id = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const status = fields.status?.stringValue || 'active'; // assume active if not specified
    
    if (status === 'active') {
      const updatedAt = fields.updatedAt?.timestampValue || fields.createdAt?.timestampValue || new Date();
      urls.push({
        loc: `${BASE_URL}/product/${id}`,
        lastmod: formatDate(updatedAt),
        changefreq: 'daily',
        priority: '0.8'
      });
      productCount++;
    }
  }
  console.log(`[Sitemap] Added ${productCount} active products.`);

  // 6. Fetch Users (Profiles) from Firestore
  console.log('[Sitemap] Fetching Users from Firestore...');
  const dbUsers = await fetchCollection('Users');
  let userCount = 0;
  for (const doc of dbUsers) {
    const uid = doc.name.split('/').pop();
    urls.push({
      loc: `${BASE_URL}/profile/${uid}`,
      lastmod: currentDateStr,
      changefreq: 'weekly',
      priority: '0.5'
    });
    urls.push({
      loc: `${BASE_URL}/user/${uid}`,
      lastmod: currentDateStr,
      changefreq: 'weekly',
      priority: '0.5'
    });
    userCount += 2;
  }
  console.log(`[Sitemap] Added ${userCount} user profile URLs.`);

  // 7. Fetch Groups from Firestore
  console.log('[Sitemap] Fetching Groups from Firestore...');
  const dbGroups = await fetchCollection('Groups');
  let groupCount = 0;
  for (const doc of dbGroups) {
    const groupId = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const updatedAt = fields.createdAt?.timestampValue || new Date();
    const lastmod = formatDate(updatedAt);

    // Group main page
    urls.push({
      loc: `${BASE_URL}/groups/${groupId}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.6'
    });
    // Group sub-tabs
    urls.push({ loc: `${BASE_URL}/groups/${groupId}/members`, lastmod, changefreq: 'weekly', priority: '0.5' });
    urls.push({ loc: `${BASE_URL}/groups/${groupId}/media`, lastmod, changefreq: 'weekly', priority: '0.5' });
    urls.push({ loc: `${BASE_URL}/groups/${groupId}/events`, lastmod, changefreq: 'weekly', priority: '0.5' });
    urls.push({ loc: `${BASE_URL}/groups/${groupId}/about`, lastmod, changefreq: 'weekly', priority: '0.5' });
    
    groupCount += 5;
  }
  console.log(`[Sitemap] Added ${groupCount} group URLs.`);

  // 8. Fetch Public Posts from Firestore (max 300 to prevent sitemap overflow)
  console.log('[Sitemap] Fetching public Posts from Firestore...');
  const dbPosts = await fetchCollection('Posts', 300);
  let postCount = 0;
  for (const doc of dbPosts) {
    const postId = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const status = fields.status?.stringValue;
    
    // Public by default, or explicitly set to public
    if (!status || status === 'public') {
      const createdAt = fields.createdAt?.timestampValue || new Date();
      urls.push({
        loc: `${BASE_URL}/post/${postId}`,
        lastmod: formatDate(createdAt),
        changefreq: 'daily',
        priority: '0.6'
      });
      postCount++;
    }
  }
  console.log(`[Sitemap] Added ${postCount} public post URLs.`);

  // Generate XML content
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xmlContent += '  <url>\n';
    xmlContent += `    <loc>${url.loc}</loc>\n`;
    xmlContent += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xmlContent += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xmlContent += `    <priority>${url.priority}</priority>\n`;
    xmlContent += '  </url>\n';
  }
  
  xmlContent += '</urlset>\n';

  // Write to public/sitemap.xml
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(sitemapPath, xmlContent, 'utf8');
  console.log(`[Sitemap] Success! Wrote ${urls.length} URLs to ${sitemapPath}`);
}

generate().catch(err => {
  console.error('[Sitemap] Generation failed:', err);
  process.exit(1);
});
