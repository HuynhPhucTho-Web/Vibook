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
# React Websocket
npm install react-use-websocket
## Rule
9:10
26/08/2025
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
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'reactedBy', 'reactions', 'reactionCount'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update: if request.auth != null && (
          request.auth.uid == resource.data.userId ||
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions', 'reactionCount', 'replyCount'])
        );
        allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      
        // Replies subcollection with unlimited nesting
        match /replies/{replyId} {
          allow read: if true;
          allow create: if request.auth != null;
          allow update: if request.auth != null && (
            request.auth.uid == resource.data.userId ||
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions', 'reactionCount', 'replyCount'])
          );
          allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
        
          // Enable recursive replies (unlimited nesting)
          match /{document=**} {
            allow read: if true;
            allow create: if request.auth != null;
            allow update: if request.auth != null && (
              request.auth.uid == resource.data.userId ||
              request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions', 'reactionCount', 'replyCount'])
            );
            allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
          }
        }
      
        // Comment reactions subcollection
        match /reactions/{userId} {
          allow read: if true;
          allow write: if request.auth != null;
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
    // Groups collection
    match /Groups/{groupId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.ownerId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['members'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    // Events collection
    match /Events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.ownerId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['attendees'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    // Stories collection
    match /Stories/{storyId} {
      allow read: if true; // Public read access
      allow create: if request.auth != null; // Any authenticated user can create
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['mediaFiles']) // Allow updates to mediaFiles if needed
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId; // Only owner can delete
    }
// 🔹 Posts trong Group
match /Posts/{postId} {
  allow read: if true;

  // Chỉ cho phép user đăng nhập tạo post của chính mình
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

  // Cho phép update:
  // - Nếu chính chủ post => có thể update title, content, mediaUrls, status
  // - Hoặc ai cũng có thể update reaction fields
  allow update: if request.auth != null && (
    // Chủ post update toàn bộ fields hợp lệ
    (
      request.auth.uid == resource.data.userId &&
      request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['title','content','mediaUrls','status','likes','reactedBy','reactions','reactionCount'])
    )
    ||
    // Người khác chỉ được update reaction fields
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['likes','reactedBy','reactions','reactionCount'])
  );

  // Chỉ chủ post được xóa
  allow delete: if request.auth != null && request.auth.uid == resource.data.userId;

  // 🔹 Comments trong post
  match /comments/{commentId} {
    allow read: if true;
    allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    allow update: if request.auth != null && (
      request.auth.uid == resource.data.userId ||
      request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['reactions','reactionCount','replyCount'])
    );
    allow delete: if request.auth != null && request.auth.uid == resource.data.userId;

    // Replies lồng nhau
    match /replies/{replyId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['reactions','reactionCount','replyCount'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;

      // Cho phép nesting không giới hạn
      match /{document=**} {
        allow read: if true;
        allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
        allow update: if request.auth != null && (
          request.auth.uid == resource.data.userId ||
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['reactions','reactionCount','replyCount'])
        );
        allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    }

    // Comment reactions
    match /reactions/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
}
}