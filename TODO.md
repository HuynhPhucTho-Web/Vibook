# TODO List

## Completed Tasks
- [x] Add search functionality to Header.jsx
  - Added state for search results and isSearching
  - Implemented useEffect to search posts based on searchValue
  - Added debounced search with 300ms delay
  - Updated search dropdown to display results with user avatars and post content
  - Added loading state and "no results" message
- [x] Fix user data fetching in PostDetail.jsx
  - Changed from using query with where to getDoc with doc reference for user data
  - Removed unused 'where' import
- [x] Add route for PostDetail in App.jsx
  - Added route "/Post/:postId" in the protected routes section

## Pending Tasks
- [ ] Test the search functionality to ensure it works correctly
- [ ] Test the PostDetail page to ensure user data loads properly
- [ ] Verify that clicking on search results navigates to the correct post detail page
