# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

npm install framer-motion
npm install react-router-dom
npm install firebase
npm install react-toastify
npm install bootstrap
npm install -D tailwindcss@3
npm install react-router-dom react-icons
npm install -D tailwindcss postcss autoprefixer
npm create vite@latest spotify-profile-demo -- --template vanilla-ts
npm install react
npm install bootstrap
npm install emoji-picker-react
npm install lucide-react
npm i @emoji-mart/react @emoji-mart/data
npm install lucide-react
npm install react-icons --save
npm install framer-motion

## Short Dependence

npm install react-router-dom react-icons react-toastify bootstrap firebase
npm install -D eslint eslint-plugin-react eslint-plugin-react-refresh

## buil run firebase

npm install -g firebase-tools

## Check version 14.11.2

firebase --version
firebase login
npm run build
firebase init
npx update-browserslist-db@latest
select
✅ Hosting: Configure files for Firebase Hosting...
Spacebar
git add .
git commit -m "Setup Firebase Hosting"
git push origin main
firebase deploy
npm i @cloudinary/url-gen @cloudinary/react
npm install @cloudinary/react @cloudinary/url-gen
npm install @cloudinary/react@latest

## Build and Check

npm run build
npm run preview

# React Websocket

npm install react-use-websocket

# Build app android

npx cap sync android
npx cap run android

# Build app IOS

npx cap sync ios
npx cap run ios
npm install react-player
firebase deploy --only firestore:rules

## Design System & UI Standards

Tham khảo đầy đủ: [`DESIGN.md`](./DESIGN.md)

### Kích thước container chuẩn (đồng bộ mọi trang)

| Loại | max-width | Căn giữa | Padding |
|------|-----------|----------|---------|
| Trang chính (Home/Blog/Profile/…) | `1200px` | `margin: 0 auto` | `var(--vb-space-2)` |
| Dashboard | `1400px` | `margin: 0 auto` | `var(--vb-space-2)` |
| Modal | `680px` | `margin: x auto` | `var(--vb-space-3)` |
| Mobile (≤820px) | `100%` | — | `0.5rem` |

Pattern container chuẩn:

```css
.container-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--vb-space-2) var(--vb-space-2) var(--vb-space-4);
}
```

**Quy tắc:** Không hardcode width nhỏ (`680px`) cho container trang — chỉ dùng `680px` cho modal. Luôn có `@media (max-width: 820px)` cho mobile. Xem chi tiết breakpoints & spacing trong `DESIGN.md`.
