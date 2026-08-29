# Đ12 — Portfolio nhiếp ảnh cưới | Tessa Morgan — Wedding Photographer

Website portfolio nhiếp ảnh cưới tĩnh (HTML5 + CSS3 + Vanilla JS), render dữ liệu động từ JSON nội bộ, tối ưu Lighthouse Performance ≥ 90.

## Công nghệ sử dụng
- HTML5 / Semantic HTML
- CSS3 thuần (style.css + responsive.css, không framework)
- JavaScript ES5/ES6 thuần (Vanilla JS, không thư viện)
- Dữ liệu JSON nội bộ (`data/gallery.json`, `data/blog.json`)

## Cấu trúc dự án
```text
.
├─ index.html                 # Trang chủ
├─ pages/
│  ├─ services.html           # Dịch vụ, bảng giá $399–$2999 & FAQ Accordion
│  ├─ about.html              # Giới thiệu Tessa Morgan
│  ├─ portfolio.html          # Masonry + filter Category + URL query state
│  ├─ album-detail.html       # Chi tiết album + Lightbox + Slideshow + Copy link
│  ├─ blog.html               # Danh sách bài viết + tìm kiếm + lọc + phân trang
│  ├─ blog-detail.html        # Chi tiết bài viết
│  ├─ contact.html            # Form liên hệ/đặt chụp + inline validation + auto-fill
│  └─ 404.html                # Trang lỗi, gợi ý ngẫu nhiên 2 album + 2 bài viết
├─ data/
│  ├─ gallery.json            # Album: Wedding / Engagement / Portrait
│  └─ blog.json               # Bài viết & từ khóa
├─ js/
│  ├─ main.js                 # Tiện ích chung, mobile nav, scroll-top, parallax, reveal
│  ├─ gallery.js              # Masonry, filter, URL state, lightbox, slideshow, clipboard
│  ├─ faq.js                  # Accordion FAQ (services.html)
│  ├─ blog.js                 # Lọc, tìm kiếm & phân trang blog
│  └─ contact.js              # Inline validation & auto-fill ?package=
├─ css/
│  ├─ style.css               # Design tokens & component chung
│  └─ responsive.css          # Breakpoint tablet / mobile
├─ images/
├─ package.json
└─ README.md
```

## Chạy dự án
```bash
npm install
npm run serve   # http://localhost:8080
```
(Cần chạy qua HTTP server vì các trang fetch dữ liệu JSON.)

## Tính năng chính
- **Navigation đồng bộ 9 trang**: Trang chủ | Bộ sưu tập | Dịch vụ & Bảng giá | Giới thiệu | Blog | Liên hệ.
- **Portfolio**: Masonry responsive, lọc `Wedding / Engagement / Portrait`, trạng thái lọc lưu trên URL (`?category=Wedding` — F5 không mất).
- **Album detail**: Lightbox (Next/Prev, phím mũi tên, Esc, focus trap & trả focus về ảnh đã click), Slideshow toàn màn hình (tự chuyển, hover tạm dừng, thoát bằng nút/Esc), nút sao chép link album (Clipboard API + toast).
- **Services**: 4 gói PHOTOGRAPHY PACKAGE ($399 / $799 / $1999 / $2999), nút Book Now chuyển sang `contact.html?package=...`, FAQ Accordion.
- **Contact**: Auto-fill gói chụp từ URL, inline validation khi blur/submit (lỗi hiển thị dưới từng ô), toast thành công.
- **Blog**: live-search theo từ khóa, lọc chủ đề, phân trang.
- **404**: gợi ý ngẫu nhiên 2 album + 2 bài viết.
- **Hiệu năng (Lighthouse ≥ 90)**: `loading="lazy"` cho toàn bộ ảnh (trừ hero với `fetchpriority="high"`), mọi khung ảnh khai báo sẵn `width/height` + `aspect-ratio` → CLS = 0, tôn trọng `prefers-reduced-motion`.
