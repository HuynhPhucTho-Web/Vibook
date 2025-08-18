# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

npm install react-router-dom
npm install firebase
npm install react-toastify
npm install bootstrap
npm install -D tailwindcss@3
npm install react-router-dom react-icons
npm install react

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


## Rule
9:10
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /Users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
    match /Posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'reactedBy', 'reactions'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update: if request.auth != null && (
          request.auth.uid == resource.data.userId ||
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'reactions', 'reactedBy'])
        );
        allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
        
        // Replies subcollection
        match /replies/{replyId} {
          allow read: if true;
          allow create: if request.auth != null;
          allow update: if request.auth != null && (
            request.auth.uid == resource.data.userId ||
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'reactions', 'reactedBy'])
          );
          allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
        }
        
        // Comment reactions subcollection
        match /reactions/{userId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // Messages collection
    match /Messages/{chatId} {
      allow read: if request.auth != null && (request.auth.uid in chatId.split('_'));
      allow write: if request.auth != null && (request.auth.uid in chatId.split('_'));
      
      match /messages/{messageId} {
        allow read: if request.auth != null && (
          request.auth.uid == resource.data.senderId ||
          request.auth.uid == resource.data.receiverId ||
          request.auth.uid in chatId.split('_')
        );
        allow create: if request.auth != null &&
          request.auth.uid == request.resource.data.senderId &&
          request.auth.uid in chatId.split('_') &&
          request.resource.data.receiverId in chatId.split('_');
        allow update, delete: if request.auth != null && request.auth.uid == resource.data.senderId;
      }
    }
    
    // Notifications collection
    match /Notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }
  }
}