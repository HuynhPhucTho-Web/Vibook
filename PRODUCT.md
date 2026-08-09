# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

- React 19 + Vite
- TailwindCSS v3 (styling and grid utilities)
- React-Bootstrap / Bootstrap 5 (UI structures)
- Capacitor 8 (Hybrid Android mobile integration)
- Firebase 12 (Authentication, Firestore database, and Web Hosting)
- Cloudinary (Media storage & optimization)
- Framer Motion (Micro-interactions and transitions)

## Users

- **Primary User:** Avid readers, book lovers, and book club members.
- **Goal:** Manage personal reading logs (book status, shelve organization), write and read reviews, publish blog posts, and participate in community discussions/events.
- **Context:** Accessing the platform from a desktop/laptop for writing long-form reviews or blog posts, and switching to a mobile device on-the-go for quick updates, browsing feeds, or checking event schedules.

## Product Purpose

Vibook is a social-driven book network that merges personal library organization (reading progress, shelves) with rich social features (feed posts, comments, likes) and long-form blogging. It aims to make reading a shared, communal experience by connecting readers, bloggers, and event coordinators in one unified application.

## Positioning

Unlike traditional, static book tracking tools (e.g., Goodreads) or generic blogging platforms (e.g., Medium), Vibook combines reading tracking, community social feeds, and dedicated long-form blogging natively under a single user identity and interface.

## Operating Context

- **Widescreen Desktop:** Multi-column layout with sidebar navigation, main feed, and auxiliary panels (e.g., trending books, upcoming events) fitting within a standard `1200px` container.
- **Mobile Devices:** A single-column layout optimized for touch interaction, wrapped in a native Android shell via Capacitor.

## Capabilities and Constraints

- **Capacitor Integration:** Must perform smoothly on Android devices (low DOM size, efficient rendering, touch-friendly touch targets).
- **Media Uploads:** Handled via Cloudinary (requires optimized layouts for book covers and user attachments).
- **Responsive Layout Constraints:** Must follow the standard page container width (`1200px` max, margin center) and standard breakpoints (mobile `≤ 820px`).

## Brand Commitments

- **Name:** Vibook
- **Design Philosophy:** Modern Clean & Content-First (Minimalist, content-focused).
- **Visual Vocabulary:** Subtle borders, light-soft or soft-dark backgrounds, card-based layout grids, and high-readability typography to avoid eye strain during long sessions.

## Product Principles

1. **Content-First Centered:** The user's books, written content, and reviews are the main focus. Visual chrome and interface wrappers should recede.
2. **Smooth Adaptability:** Maintain a consistent, responsive feel across the web, tablet, and mobile shell without duplicating layout logic.
3. **Legibility & Comfort:** Text density and typography hierarchy must support extended reading sessions.
4. **Structured Rhythm:** Use the 8px layout/spacing system uniformly to keep elements predictable and structured.
