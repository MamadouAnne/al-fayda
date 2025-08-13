# AL Fayda: Frontend Development Plan

This document outlines the complete frontend build plan for the AL Fayda mobile application. We will use Expo, Expo Router for navigation, and Tailwind CSS for styling. The project will be built "frontend-first" with mock data, with clear placeholders for future Supabase integration.

---

## 1. Project Structure

A clean, scalable folder structure is essential.

```
/
├── docs/
│   ├── development-plan.md  // This file
│   └── build-log.md         // Progress tracking
├── app/
│   ├── (auth)/                // Routes for the authentication flow
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── verify-org.tsx
│   ├── (tabs)/                // Main app layout after authentication
│   │   ├── _layout.tsx        // Tab bar definition
│   │   ├── home.tsx           // Home Feed
│   │   ├── search.tsx         // Search & Discovery
│   │   ├── friends.tsx        // Friend Requests
│   │   └── profile.tsx        // User Profile
│   ├── _layout.tsx            // Root layout (handles auth state)
│   └── index.tsx              // Entry point, redirects based on auth
├── assets/
│   ├── images/
│   └── fonts/
├── components/
│   ├── core/                  // Reusable, generic components (Button, Input, Card)
│   ├── auth/                  // Components specific to authentication screens
│   ├── feed/                  // Components for the Home Feed (PostCard, Stories)
│   ├── profile/               // Components for the Profile screen
│   └── messaging/             // Components for the chat interface
├── constants/
│   ├── Colors.ts              // App color palette, including gradients
│   ├── MockData.ts            // All mock data for users, posts, etc.
│   └── Styles.ts              // Global style constants
├── contexts/
│   ├── AuthContext.tsx        // Manages user session and auth state
│   └── ThemeContext.tsx       // Manages light/dark mode
├── hooks/
│   ├── useAuth.ts             // Hook for accessing AuthContext
│   ├── useApi.ts              // Placeholder hooks for API calls (e.g., useFeed, useProfile)
│   └── useTheme.ts            // Hook for accessing ThemeContext
└── lib/
    └── supabase.ts            // Placeholder for Supabase client setup
```

---

## 2. Development Phases

### Phase 1: Project Setup & Foundation (Current)
- **Description:** Initialize the Expo project, configure Tailwind CSS, set up the folder structure, and create documentation.
- **Components:** None.
- **Files:** `package.json`, `tailwind.config.js`, `app.json`, initial folder creation.

### Phase 2: Authentication Flow & Navigation
- **Description:** Build the UI for Sign In, Sign Up, and Organization Code verification. Implement the root navigation logic that separates the auth flow from the main app.
- **Screens:** `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `app/(auth)/verify-org.tsx`.
- **Components:** `core/Input.tsx`, `core/Button.tsx`, `auth/AuthScreenLayout.tsx`.
- **State Management:** Create `AuthContext` to manage user state (mocked).

### Phase 3: Core Tabbed Screens
- **Description:** Build the four main screens accessible from the tab bar, populated with mock data.
- **Screens:**
    - `app/(tabs)/home.tsx`: Home feed with stories and posts.
    - `app/(tabs)/search.tsx`: Search bar and list of member results.
    - `app/(tabs)/friends.tsx`: List of friend requests with Accept/Reject buttons.
    - `app/(tabs)/profile.tsx`: User profile view with organization header.
- **Components:**
    - `feed/StoryBubble.tsx` (with gradient border)
    - `feed/PostCard.tsx`
    - `core/UserListItem.tsx`
    - `profile/ProfileHeader.tsx`
    - `profile/OrgHeader.tsx`

### Phase 4: Feature Implementation
- **Description:** Build the remaining feature UIs, which will often be presented as modals or separate screens.
- **Screens/Features:**
    - **Post Composer:** A modal for creating text, image, or video posts.
    - **Comments:** A screen or bottom sheet to display threaded comments for a post.
    - **Messaging:** UI for the list of chats and the 1-on-1 message screen.
    - **Notifications:** A dedicated screen to show a list of notifications.
- **Components:** `core/Modal.tsx`, `feed/CommentThread.tsx`, `messaging/ChatBubble.tsx`.

### Phase 5: Styling, Refinement & Integration Prep
- **Description:** Polish the UI, add animations, implement dark mode, and finalize the placeholder API hooks.
- **Tasks:**
    - Implement dark mode switching via `ThemeContext`.
    - Add smooth layout animations and screen transitions.
    - Ensure responsiveness across different device sizes.
    - Review all `useApi.ts` hooks to ensure they match the expected data structures for Supabase.

---

## 3. Supabase Integration Notes

- **Authentication:** The `useAuth` hook will wrap Supabase Auth functions (`signUp`, `signIn`, `signOut`). The organization code verification will be a custom RPC call to a Supabase Function.
- **Data Fetching:** All mock data fetches in `useApi.ts` will be replaced with calls to Supabase tables (e.g., `supabase.from('posts').select('*')`).
- **Real-time:** Supabase Realtime subscriptions will be used for the home feed, notifications, and messaging.
- **Storage:** User-uploaded content (avatars, post images/videos) will use Supabase Storage.
