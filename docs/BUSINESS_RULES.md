ViBook Business Requirement Document (BRD)
Version
Project: ViBook Social Network
Version: 2.0
Document Type: Business Requirement
Status: Approved
1. Tổng quan hệ thống
1.1 Mục tiêu

ViBook là mạng xã hội cho phép người dùng:

đọc tin tức
xem hồ sơ
tham gia nhóm
xem video
xem story
mua bán
chơi game
kết bạn
nhắn tin

Hệ thống phải cho phép Guest có thể xem gần như toàn bộ nội dung, nhưng chỉ người đã đăng nhập mới được phép thực hiện các hành động thay đổi dữ liệu.

2. Authentication Business Rules
2.1 Landing Page

Không được mở Login đầu tiên.

/
↓

/homevibook

Home luôn là trang mặc định.

2.2 Guest User

Guest được phép:

✔ Xem Feed

✔ Xem Post

✔ Xem Group

✔ Xem Event

✔ Xem Video

✔ Xem Game

✔ Xem Marketplace

✔ Xem Friend Directory

Guest KHÔNG được:

nhắn tin
comment
like
follow
kết bạn
checkout
tạo nội dung
2.3 Login Required

Không redirect ngay.

Thay vào đó:

Guest

↓

Click Action

↓

Toast

Bạn cần đăng nhập

[Đăng nhập]
[Đăng ký]
[Đóng]

Người dùng vẫn ở nguyên trang.

2.4 Login Return

Sau khi login thành công.

Ưu tiên:

location.state.from

↓

sessionStorage.vibook_login_from

↓

/homevibook
3. Route Business Rules
3.1 Public Routes
Route	Guest
/homevibook	✅
/post/:id	✅
/user/:uid	✅
/groups	✅
/groups/:id	✅
/events	✅
/videos	✅
/story	✅
/playgame	✅
/market	✅
/product/:id	✅
/friends	✅
3.2 Private Routes
Route	Login
/messenger	Required
/notifications	Required
/profile	Required
/settings	Required
/cart	Required
/checkout	Required
/my-orders	Required
/seller-dashboard	Required
/manage-products	Required
4. Sidebar Business Rules
Guest

Hiển thị:

Home
Friends
Groups
Events
Videos
Story
PlayGame
Market

Messenger

↓

Click

↓

Login

Settings

↓

Click

↓

Login

Logout

↓

Disabled

5. Header Business Rules

Guest chỉ hiển thị:

Login
Register

Ẩn:

Messenger
Notification
User Menu
Avatar
unreadCount = 0
6. Write Action Rules

Tất cả hành động ghi dữ liệu đều phải gọi

requireLogin()

Bao gồm:

Feed
Create Post
Edit Post
Delete Post
Like
Reaction
Save
Share
Report
Comment
Create
Reply
Like
Group
Join
Leave
Create
Create Post
Event
Join
Leave
Create
Friend
Add Friend
Accept
Reject
Follow
Story
Create Story
Game
Create Game
Marketplace
Add Cart
Checkout
Buy
Review
Messenger
Open Chat
Send Message
7. requireLogin Business Flow
Guest

↓

Action

↓

requireLogin()

↓

Toast

↓

Login Button

↓

sessionStorage

↓

Login

↓

Redirect

↓

Continue Action

Không được redirect ngay khi click.

8. RequireAuth Business Flow

Chỉ áp dụng cho:

Messenger
Settings
Checkout
Notifications
Seller Dashboard

Flow

Guest

↓

Private Route

↓

RequireAuth

↓

Login

↓

Back
9. Friends Module

Guest chỉ được:

Find Friends

Không được xem:

My Friends
Friend Requests

Click sẽ hiện Login Toast.

10. Marketplace

Guest

Được:

xem sản phẩm
tìm kiếm
lọc

Không được:

Add Cart
Checkout
Review
11. Groups

Guest

Được:

xem danh sách
xem bài viết
xem thành viên

Không được:

Join
Post
Comment
12. Events

Guest

Được:

xem sự kiện
xem người tham gia

Không được:

Join
Create
13. Messenger

Guest

Không truy cập.

Sidebar

↓

Login

URL

/messenger

↓

RequireAuth

14. Settings

Guest nhìn thấy menu.

Click

↓

Login Toast

Không redirect.

15. UX Rules

Nguyên tắc xuyên suốt hệ thống:

Người dùng luôn có thể duyệt nội dung (Browse First) trước khi đăng nhập.
Chỉ chặn tại thời điểm thực hiện hành động ghi dữ liệu (Write Action).
Không ép đăng nhập ngay khi truy cập các trang công khai.
Luôn ưu tiên trải nghiệm liên tục bằng cách lưu state.from hoặc sessionStorage.vibook_login_from để quay lại đúng vị trí sau khi đăng nhập.