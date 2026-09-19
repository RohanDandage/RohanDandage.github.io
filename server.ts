import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec, execSync } from 'child_process';

const app = express();
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Resolve directories
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const srcCss = path.join(rootDir, 'src', 'tailwind.css');
const outCss = path.join(rootDir, 'css', 'tailwind.css');

// Auto-recompile Tailwind CSS when src/tailwind.css changes in development
let isCompilingCss = false;
let pendingCssCompile = false;

function compileTailwindCss() {
  if (isCompilingCss) {
    pendingCssCompile = true;
    return;
  }
  isCompilingCss = true;
  exec('npx tailwindcss -i src/tailwind.css -o css/tailwind.css --minify', (err) => {
    isCompilingCss = false;
    if (err) {
      console.error('[tailwind] compilation error:', err.message);
    } else {
      console.log('[tailwind] css recompiled successfully');
    }
    if (pendingCssCompile) {
      pendingCssCompile = false;
      compileTailwindCss();
    }
  });
}

if (!isProd) {
  try {
    const srcDir = path.join(rootDir, 'src');
    if (fs.existsSync(srcDir)) {
      fs.watch(srcDir, (_eventType, filename) => {
        if (filename && filename.endsWith('.css')) {
          console.log(`[watcher] ${filename} changed, triggering tailwind build...`);
          compileTailwindCss();
        }
      });
      console.log('[watcher] watching src/ for CSS changes');
    }
  } catch (err) {
    console.error('[watcher] error watching src directory:', err);
  }
}

// Development caching headers: prevent stale cache in preview iframe
app.use((_req, res, next) => {
  if (!isProd) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Dynamic check for /css/tailwind.css to guarantee fresh CSS on demand
app.get('/css/tailwind.css', (_req, _res, next) => {
  if (!isProd && fs.existsSync(srcCss)) {
    try {
      const srcStat = fs.statSync(srcCss);
      const outExists = fs.existsSync(outCss);
      const outStat = outExists ? fs.statSync(outCss) : null;
      if (!outExists || srcStat.mtimeMs > outStat!.mtimeMs) {
        execSync('npx tailwindcss -i src/tailwind.css -o css/tailwind.css --minify');
      }
    } catch (err) {
      console.error('[tailwind] on-demand compile error:', err);
    }
  }
  next();
});

// In development, serve rootDir first so index.html and assets are always live
if (isProd && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.use(express.static(rootDir, { index: false }));
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Rohan Dandage Portfolio' });
});

// Serve index.html (always live from rootDir in dev mode)
app.get(['/', '/index.html'], (_req, res) => {
  const targetHtml = isProd && fs.existsSync(path.join(distDir, 'index.html'))
    ? path.join(distDir, 'index.html')
    : path.join(rootDir, 'index.html');
  res.sendFile(targetHtml);
});

// Fallback to index.html
app.get('*', (_req, res) => {
  const targetHtml = isProd && fs.existsSync(path.join(distDir, 'index.html'))
    ? path.join(distDir, 'index.html')
    : path.join(rootDir, 'index.html');
  res.sendFile(targetHtml);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
});
