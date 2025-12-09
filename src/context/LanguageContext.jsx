import { createContext, useEffect, useState } from "react";

// Translation data
const translations = {
  en: {
    // Header
    searchPlaceholder: "Search people, posts, groups...",
    searching: "Searching...",
    noResults: "No results found for",
    users: "Users",
    posts: "Posts",
    themeStyle: "Theme Style",

    // Navigation
    home: "Home",
    profile: "Profile",
    messenger: "Messenger",
    notifications: "Notifications",
    groups: "Groups",
    events: "Events",
    friends: "Friends",
    story: "Story",
    playGame: "Play Game",

    // Common
    loading: "Loading ViBook...",
    anonymous: "Anonymous",
    noContent: "No content",
    language: "Language",

    // Groups
    groupsCount: "Groups",
    createGroup: "Create Group",
    joinGroup: "Join Group",
    leaveGroup: "Leave Group",
    deleteGroup: "Delete Group",
    groupName: "Group Name",
    groupDescription: "Description",
    members: "Members",
    media: "Media",
    about: "About",

    // Stories
    createStory: "Create Story",
    close: "Close",
    whatsYourStory: "What's your story title?",
    postStory: "Post Story",
    uploading: "Uploading…",
    noStories: "No stories yet. Click",
    toPostFirst: "to post your first one!",
    storyDeleted: "Story deleted",

    // Notifications
    markAsRead: "Mark as Read",
    deleteOldNotifications: "Delete old notifications (>3 days)",
    noUnreadNotifications: "No unread notifications",
    markedAsRead: "Marked as read",
    notificationsRead: "notification is read",

    // Messenger
    welcomeToMessenger: "Welcome to Messenger",
    selectChat: "Select a chat to start messaging",

    // Auth
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signUp: "Sign Up",
    signIn: "Sign In",
    signOut: "Sign Out",

    // Profile
    viewProfile: "View Profile",
    settings: "Settings",
    editProfile: "Edit Profile",
    updateProfile: "Update Profile",

    // Posts
    createPost: "Create Post",
    post: "Post",
    comment: "Comment",
    like: "Like",
    share: "Share",

    // Friends
    addFriend: "Add Friend",
    removeFriend: "Remove Friend",
    friendRequestSent: "Friend request sent",
    friendRequestAccepted: "Friend request accepted",
    myFriends: "My Friends",
    friendRequests: "Friend Requests",
    findFriends: "Find Friends",

    // Events
    createEvent: "Create Event",
    eventName: "Event Name",
    eventDate: "Event Date",
    eventLocation: "Event Location",
    createNewEvent: "Create New Event",
    updateEvent: "Update Event",
    eventNameRequired: "Event name and date cannot be empty",
    loginToCreateEvent: "Please log in to create an event",
    eventCreated: "Event created successfully!",
    eventCreateFailed: "Failed to create event",
    eventUpdated: "Event updated successfully!",
    eventUpdateFailed: "Failed to update event",
    loginToJoinEvent: "Please log in to join the event",
    joinedEvent: "Joined event successfully!",
    joinEventFailed: "Failed to join event",
    loginToLeaveEvent: "Please log in to leave the event",
    leftEvent: "Left event successfully!",
    leaveEventFailed: "Failed to leave event",
    onlyOwnerDelete: "Only the event owner can delete the event",
    eventDeleted: "Event deleted successfully!",
    eventDeleteFailed: "Failed to delete event",
    loginToViewEvents: "Please log in to view and join events",
    searchEvents: "Search events...",
    create: "Create",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    participants: "Participants",
    date: "Date:",
    location: "Location:",
    leaveEvent: "Leave Event",
    joinEvent: "Join Event",
    created: "Created:",
    noEventsFound: "No events found. Create your first event!",
    unableToLoadEvents: "Unable to load events",
    eventChat: "Event chat",
    justNow: "Just now",
    enterEventName: "Enter event name",
    enterLocation: "Enter location (optional)",
    enterEventDescription: "Enter event description (optional)",
    eventDescription: "Description",
    dateAndTime: "Date & Time",
    eventsTitle: "Events",

    // Game
    gameInstructions: "Game Instructions",

    // Post creation
    whatsOnYourMind: "What's on your mind?",
    photoVideo: "Photo/Video",
    camera: "Camera",
    document: "Document",
    emoji: "Emoji",
    posting: "Posting...",
    mediaAttached: "Media attached",
    maxFilesReached: "Max files reached",
    cameraActive: "Camera active",
    switch: "Switch",
    capture: "Capture",
    searchEmoji: "Search emoji...",
    loginRequired: "Please log in to post",
    contentOrMediaRequired: "Please enter content or attach media",
    maxFilesLimit: "Maximum 5 files per post",
    postSuccess: "Post created successfully",
    postError: "Error creating post",
    cloudinaryConfigMissing: "Missing Cloudinary configuration in .env",
    photoCaptured: "Photo captured and added to post",
    cameraError: "Cannot open camera. Please check permissions",
    uploadFailed: "Upload failed: ",
    switchCamera: "Switch camera",
    capturePhoto: "Capture photo",
    attachedMedia: "Attached media",
    limitReached: "Limit reached",

    // Error messages
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",

    // Loading states
    loadingText: "Loading...",
    saving: "Saving...",
    deleting: "Deleting...",

    // Profile specific
    userNotFound: "User not found",
    youHaventPostedYet: "You haven't posted yet",
    noPostsYet: "No posts yet",
    failedToSendFriendRequest: "Failed to send friend request.",
    friendRequestSentTo: "Friend request sent to {name}!",

    // Sidebar
    logout: "Logout",
    logoutSuccess: "Logged out successfully",
    logoutFailed: "Failed to log out: ",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
  },
  vi: {
    // Header
    searchPlaceholder: "Tìm kiếm người dùng, bài viết, nhóm...",
    searching: "Đang tìm kiếm...",
    noResults: "Không tìm thấy kết quả cho",
    users: "Người dùng",
    posts: "Bài viết",
    themeStyle: "Kiểu giao diện",

    // Navigation
    home: "Trang chủ",
    profile: "Hồ sơ",
    messenger: "Tin nhắn",
    notifications: "Thông báo",
    groups: "Nhóm",
    events: "Sự kiện",
    friends: "Bạn bè",
    story: "Story",
    playGame: "Chơi game",

    // Common
    loading: "Đang tải ViBook...",
    anonymous: "Ẩn danh",
    noContent: "Không có nội dung",

    // Groups
    groupsCount: "Nhóm",
    createGroup: "Tạo nhóm",
    joinGroup: "Tham gia nhóm",
    leaveGroup: "Rời nhóm",
    deleteGroup: "Xóa nhóm",
    groupName: "Tên nhóm",
    groupDescription: "Mô tả",
    members: "Thành viên",
    media: "Media",
    about: "Giới thiệu",

    // Stories
    createStory: "Tạo story",
    whatsYourStory: "Tiêu đề story của bạn?",
    postStory: "Đăng story",
    uploading: "Đang tải lên…",
    noStories: "Chưa có story nào. Nhấn",
    toPostFirst: "để đăng story đầu tiên!",
    storyDeleted: "Đã xóa story",

    // Notifications
    markAsRead: "Đánh dấu đã đọc",
    deleteOldNotifications: "Xóa thông báo cũ (>3 ngày)",
    noUnreadNotifications: "Không có thông báo chưa đọc",
    markedAsRead: "Đã đánh dấu đã đọc",
    notificationsRead: "thông báo đã đọc",

    // Messenger
    welcomeToMessenger: "Chào mừng đến Messenger",
    selectChat: "Chọn cuộc trò chuyện để bắt đầu nhắn tin",

    // Auth
    login: "Đăng nhập",
    register: "Đăng ký",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    signUp: "Đăng ký",
    signIn: "Đăng nhập",
    signOut: "Đăng xuất",

    // Profile
    viewProfile: "Xem hồ sơ",
    settings: "Cài đặt",
    editProfile: "Chỉnh sửa hồ sơ",
    updateProfile: "Cập nhật hồ sơ",

    // Posts
    createPost: "Tạo bài viết",
    post: "Đăng",
    comment: "Bình luận",
    like: "Thích",
    share: "Chia sẻ",

    // Friends
    addFriend: "Thêm bạn",
    removeFriend: "Xóa bạn",
    friendRequestSent: "Đã gửi lời mời kết bạn",
    friendRequestAccepted: "Đã chấp nhận lời mời kết bạn",
    myFriends: "Bạn bè của tôi",
    friendRequests: "Lời mời kết bạn",
    findFriends: "Tìm bạn bè",

    // Events
    createEvent: "Tạo sự kiện",
    eventName: "Tên sự kiện",
    eventDate: "Ngày sự kiện",
    eventLocation: "Địa điểm sự kiện",
    createNewEvent: "Tạo sự kiện mới",
    updateEvent: "Cập nhật sự kiện",
    eventNameRequired: "Tên sự kiện và ngày không được để trống",
    loginToCreateEvent: "Vui lòng đăng nhập để tạo sự kiện",
    eventCreated: "Tạo sự kiện thành công!",
    eventCreateFailed: "Tạo sự kiện thất bại",
    eventUpdated: "Cập nhật sự kiện thành công!",
    eventUpdateFailed: "Cập nhật sự kiện thất bại",
    loginToJoinEvent: "Vui lòng đăng nhập để tham gia sự kiện",
    joinedEvent: "Tham gia sự kiện thành công!",
    joinEventFailed: "Tham gia sự kiện thất bại",
    loginToLeaveEvent: "Vui lòng đăng nhập để rời sự kiện",
    leftEvent: "Rời sự kiện thành công!",
    leaveEventFailed: "Rời sự kiện thất bại",
    onlyOwnerDelete: "Chỉ chủ sở hữu mới có thể xóa sự kiện",
    eventDeleted: "Xóa sự kiện thành công!",
    eventDeleteFailed: "Xóa sự kiện thất bại",
    loginToViewEvents: "Vui lòng đăng nhập để xem và tham gia sự kiện",
    searchEvents: "Tìm kiếm sự kiện...",
    create: "Tạo",
    cancel: "Hủy",
    save: "Lưu",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    participants: "Người tham gia",
    date: "Ngày:",
    location: "Địa điểm:",
    leaveEvent: "Rời sự kiện",
    joinEvent: "Tham gia sự kiện",
    created: "Đã tạo:",
    noEventsFound: "Không tìm thấy sự kiện nào. Tạo sự kiện đầu tiên của bạn!",
    unableToLoadEvents: "Không thể tải sự kiện",
    eventChat: "Trò chuyện sự kiện",
    justNow: "Vừa xong",

    // Game
    gameInstructions: "Hướng dẫn chơi",

    // Post creation
    whatsOnYourMind: "Bạn đang nghĩ gì thế?",
    photoVideo: "Ảnh/Video",
    camera: "Camera",
    document: "Tài liệu",
    emoji: "Cảm xúc",
    posting: "Đang đăng...",
    mediaAttached: "Đã đính kèm media",
    maxFilesReached: "Đã đạt giới hạn tệp tin",
    cameraActive: "Camera đang hoạt động",
    switch: "Đổi",
    capture: "Chụp",
    searchEmoji: "Tìm emoji...",
    loginRequired: "Vui lòng đăng nhập để đăng bài",
    contentOrMediaRequired: "Vui lòng nhập nội dung hoặc đính kèm media",
    maxFilesLimit: "Tối đa 5 tệp mỗi bài viết",
    unsupportedFormat: "Định dạng không hỗ trợ: ",
    fileTooLarge: "Tệp quá lớn ",
    uploadFailed: "Tải lên thất bại: ",
    postSuccess: "Đăng bài thành công",
    postError: "Lỗi khi đăng bài",
    cloudinaryConfigMissing: "Thiếu cấu hình Cloudinary trong .env",
    photoCaptured: "Ảnh đã được chụp và thêm vào bài viết",
    cameraError: "Không mở được camera. Vui lòng kiểm tra quyền",
    switchCamera: "Chuyển camera",
    close: "Đóng",
    capturePhoto: "Chụp ảnh",

    // Error messages
    error: "Lỗi",
    success: "Thành công",
    warning: "Cảnh báo",
    info: "Thông tin",

    // Loading states
    loadingText: "Đang tải...",
    saving: "Đang lưu...",
    deleting: "Đang xóa...",

    // Profile specific
    userNotFound: "Không tìm thấy người dùng",
    youHaventPostedYet: "Bạn chưa đăng bài nào",
    noPostsYet: "Chưa có bài viết nào",
    failedToSendFriendRequest: "Gửi lời mời kết bạn thất bại.",
    friendRequestSentTo: "Đã gửi lời mời kết bạn đến {name}!",

    // Sidebar
    logout: "Đăng xuất",
    logoutSuccess: "Đăng xuất thành công",
    logoutFailed: "Đăng xuất thất bại: ",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
    expandSidebar: "Mở rộng sidebar",
    collapseSidebar: "Thu gọn sidebar",
  },
  ja: {
    // Header
    searchPlaceholder: "人、投稿、グループを検索...",
    searching: "検索中...",
    noResults: "の検索結果が見つかりません",
    users: "ユーザー",
    posts: "投稿",
    themeStyle: "テーマスタイル",

    // Navigation
    home: "ホーム",
    profile: "プロフィール",
    messenger: "メッセージ",
    notifications: "通知",
    groups: "グループ",
    events: "イベント",
    friends: "友達",
    story: "ストーリー",
    playGame: "ゲーム",

    // Common
    loading: "ViBookを読み込み中...",
    anonymous: "匿名",
    noContent: "コンテンツなし",

    // Groups
    groupsCount: "グループ",
    createGroup: "グループ作成",
    joinGroup: "グループ参加",
    leaveGroup: "グループ退出",
    deleteGroup: "グループ削除",
    groupName: "グループ名",
    groupDescription: "説明",
    members: "メンバー",
    media: "メディア",
    about: "について",

    // Stories
    createStory: "ストーリー作成",
    whatsYourStory: "ストーリーのタイトルは何ですか？",
    postStory: "ストーリーを投稿",
    uploading: "アップロード中…",
    noStories: "まだストーリーがありません。クリック",
    toPostFirst: "して最初のストーリーを投稿！",
    storyDeleted: "ストーリーが削除されました",

    // Notifications
    markAsRead: "既読にする",
    deleteOldNotifications: "古い通知を削除（>3日）",
    noUnreadNotifications: "未読通知なし",
    markedAsRead: "既読にしました",
    notificationsRead: "件の通知を既読",

    // Messenger
    welcomeToMessenger: "Messengerへようこそ",
    selectChat: "メッセージを開始するにはチャットを選択",

    // Auth
    login: "ログイン",
    register: "登録",
    email: "メール",
    password: "パスワード",
    confirmPassword: "パスワード確認",
    signUp: "サインアップ",
    signIn: "サインイン",
    signOut: "サインアウト",

    // Profile
    viewProfile: "プロフィールを見る",
    settings: "設定",
    editProfile: "プロフィール編集",
    updateProfile: "プロフィール更新",

    // Posts
    createPost: "投稿作成",
    post: "投稿",
    comment: "コメント",
    like: "いいね",
    share: "シェア",

    // Friends
    addFriend: "友達追加",
    removeFriend: "友達削除",
    friendRequestSent: "友達リクエスト送信済み",
    friendRequestAccepted: "友達リクエスト承認済み",
    myFriends: "マイフレンド",
    friendRequests: "フレンドリクエスト",
    findFriends: "フレンドを探す",

    // Events
    createEvent: "イベント作成",
    eventName: "イベント名",
    eventDate: "イベント日",
    eventLocation: "イベント場所",
    createNewEvent: "新しいイベントを作成",
    updateEvent: "イベントを更新",
    eventNameRequired: "イベント名と日付は必須です",
    loginToCreateEvent: "イベントを作成するにはログインしてください",
    eventCreated: "イベントが作成されました！",
    eventCreateFailed: "イベントの作成に失敗しました",
    eventUpdated: "イベントが更新されました！",
    eventUpdateFailed: "イベントの更新に失敗しました",
    loginToJoinEvent: "イベントに参加するにはログインしてください",
    joinedEvent: "イベントに参加しました！",
    joinEventFailed: "イベントへの参加に失敗しました",
    loginToLeaveEvent: "イベントを離れるにはログインしてください",
    leftEvent: "イベントを離れました！",
    leaveEventFailed: "イベントからの離脱に失敗しました",
    onlyOwnerDelete: "イベントオーナーのみがイベントを削除できます",
    onlyOwnerCanDeleteEvent: "イベントオーナーのみがイベントを削除できます",
    eventDeleted: "イベントが削除されました！",
    eventDeleteFailed: "イベントの削除に失敗しました",
    loginToViewEvents: "イベントを表示して参加するにはログインしてください",
    searchEvents: "イベントを検索...",
    create: "作成",
    cancel: "キャンセル",
    save: "保存",
    edit: "編集",
    delete: "削除",
    participants: "参加者",
    date: "日付:",
    location: "場所:",
    leaveEvent: "イベントを離れる",
    joinEvent: "イベントに参加",
    created: "作成:",
    noEventsFound: "イベントが見つかりません。最初のイベントを作成してください！",
    unableToLoadEvents: "イベントを読み込めません",
    eventChat: "イベントチャット",
    justNow: "たった今",

    // Game
    gameInstructions: "ゲーム説明",

    // Post creation
    unsupportedFormat: "サポートされていない形式: ",
    fileTooLarge: "ファイルが大きすぎます ",
    uploadFailed: "アップロード失敗: ",
    photoCaptured: "写真が撮影され、投稿に追加されました",
    cameraActive: "カメラがアクティブ",
    switchCamera: "カメラを切り替え",
    close: "閉じる",
    capturePhoto: "写真を撮影",
    searchEmoji: "絵文字を検索...",
    whatsOnYourMind: "何を考えていますか？",

    // Error messages
    error: "エラー",
    success: "成功",
    warning: "警告",
    info: "情報",

    // Loading states
    loadingText: "読み込み中...",
    saving: "保存中...",
    deleting: "削除中...",

    // Profile specific
    userNotFound: "ユーザーが見つかりません",
    youHaventPostedYet: "まだ投稿していません",
    noPostsYet: "まだ投稿がありません",
    failedToSendFriendRequest: "友達リクエストの送信に失敗しました。",
    friendRequestSentTo: "{name}に友達リクエストを送信しました！",

    // Sidebar
    logout: "ログアウト",
    logoutSuccess: "ログアウトしました",
    logoutFailed: "ログアウト失敗: ",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    expandSidebar: "サイドバーを展開",
    collapseSidebar: "サイドバーを折りたたむ",
  },
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "vi");

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
