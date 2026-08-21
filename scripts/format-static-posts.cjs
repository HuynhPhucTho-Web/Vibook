const fs = require('fs');
const path = './Staticblogposts.json';
const backup = './Staticblogposts.json.bak';

try {
  const raw = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(backup, raw, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.posts)) {
    console.error('No posts array found.');
    process.exit(1);
  }

  data.posts = data.posts.map(post => {
    if (typeof post.content === 'string') {
      const withBreaks = post.content.replace(/>\s*</g, '>\n<');
      const lines = withBreaks
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      post.content = lines;
    }
    return post;
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated', path, 'and saved backup to', backup);
} catch (err) {
  console.error(err);
  process.exit(1);
}
