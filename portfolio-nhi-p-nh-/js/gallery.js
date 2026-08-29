/* ==========================================================================
   Tessa Morgan — Wedding Photographer
   gallery.js : render bộ sưu tập 18 album từ data/gallery.json
   - portfolio.html   : lọc Danh Mục Tiếng Việt + đồng bộ URL query (?category=)
   - album-detail.html: render câu chuyện tự sự xúc cảm (180–250 từ),
                        lightbox (focus trap, bàn phím), slideshow toàn màn
                        hình & nút sao chép link album (Clipboard API)
   Yêu cầu js/main.js được nạp trước (dùng window.TM).
   ========================================================================== */

(function () {
  "use strict";

  var TM = window.TM;
  var VALID_CATEGORIES = ["Lễ Cưới", "Lễ Đính Hôn", "Ảnh Chân Dung"];

  /* Chuẩn hóa category cho URL và so khớp */
  var CATEGORY_MAP = {
    "all": "all",
    "tat-ca": "all",
    "le-cuoi": "Lễ Cưới",
    "wedding": "Lễ Cưới",
    "lễ cưới": "Lễ Cưới",
    "le-dinh-hon": "Lễ Đính Hôn",
    "engagement": "Lễ Đính Hôn",
    "lễ đính hôn": "Lễ Đính Hôn",
    "anh-chan-dung": "Ảnh Chân Dung",
    "portrait": "Ảnh Chân Dung",
    "ảnh chân dung": "Ảnh Chân Dung"
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("album-grid")) initPortfolioPage();
    if (document.getElementById("photo-grid") || document.getElementById("album-title")) initAlbumDetailPage();
  });

  function frameStyle(width, height) {
    var w = width || 1200;
    var h = height || 800;
    return "aspect-ratio: " + w + " / " + h + ";";
  }

  /* ==========================================================
     PHẦN 1 — TRANG PORTFOLIO (18 ALBUMS + BỘ LỌC + URL SYNC)
     ========================================================== */
  function initPortfolioPage() {
    var grid = document.getElementById("album-grid");
    var emptyState = document.getElementById("album-empty");
    var filterBar = document.getElementById("category-filter");
    var albums = [];

    TM.fetchJSON("data/gallery.json")
      .then(function (data) {
        albums = data.albums || [];
        /* Đọc trạng thái lọc từ URL (?category=Lễ Cưới hoặc ?category=le-cuoi) */
        var param = new URLSearchParams(window.location.search).get("category");
        var initial = "all";
        if (param) {
          var normalized = param.trim().toLowerCase();
          if (CATEGORY_MAP[normalized]) {
            initial = CATEGORY_MAP[normalized];
          } else if (VALID_CATEGORIES.indexOf(param) !== -1) {
            initial = param;
          }
        }
        setActiveButton(initial);
        render(initial);
      })
      .catch(function (err) {
        grid.innerHTML = "<p class='empty-state'>Không tải được dữ liệu bộ sưu tập. " + TM.escape(err.message) + "</p>";
      });

    /* Sự kiện bấm nút lọc */
    if (filterBar) {
      filterBar.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-btn");
        if (!btn) return;
        var category = btn.dataset.category || "all";
        setActiveButton(category);
        render(category);
        updateURL(category);
      });
    }

    function setActiveButton(category) {
      if (!filterBar) return;
      filterBar.querySelectorAll(".filter-btn").forEach(function (btn) {
        var btnCat = btn.dataset.category || "all";
        var active = btnCat === category;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    }

    function updateURL(category) {
      var url = new URL(window.location.href);
      if (category === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", category);
      }
      window.history.replaceState(null, "", url);
    }

    function render(category) {
      var list = category === "all"
        ? albums
        : albums.filter(function (a) { return a.category === category; });

      if (emptyState) {
        emptyState.hidden = list.length > 0;
      }

      grid.innerHTML = list
        .map(function (album) {
          var imgCount = (album.images && album.images.length) || 3;
          var coverImg = album.cover || (album.images && album.images[0] && album.images[0].src) || "";
          var coverW = album.coverWidth || 1200;
          var coverH = album.coverHeight || 800;

          return (
            '<div class="masonry-item reveal is-visible">' +
              '<a class="album-card img-frame" style="' + frameStyle(coverW, coverH) + '"' +
                ' href="album-detail.html?album=' + encodeURIComponent(album.id) + '"' +
                ' aria-label="Khám phá album ' + TM.escape(album.title) + '">' +
                '<img src="' + TM.escape(coverImg) + '" alt="' + TM.escape(album.title) + '"' +
                  ' width="' + coverW + '" height="' + coverH + '" loading="lazy" decoding="async">' +
                '<span class="album-info">' +
                  '<span class="album-category-badge">' + TM.escape(album.category) + ' · ' + imgCount + ' khung hình</span>' +
                  '<h3>' + TM.escape(album.title) + '</h3>' +
                  '<span class="album-location">' + TM.escape(album.location || '') + '</span>' +
                '</span>' +
              '</a>' +
            '</div>'
          );
        })
        .join("");
    }
  }

  /* ==========================================================
     PHẦN 2 — TRANG CHI TIẾT ALBUM (NARRATIVE STORY & GALLERY)
     ========================================================== */
  function initAlbumDetailPage() {
    var grid = document.getElementById("photo-grid");
    var notFound = document.getElementById("album-notfound");
    var storyContainer = document.getElementById("album-story-container");

    TM.fetchJSON("data/gallery.json")
      .then(function (data) {
        var id = new URLSearchParams(window.location.search).get("album");
        var albums = data.albums || [];
        var album = albums.filter(function (a) { return a.id === id; })[0] || null;

        if (!album) {
          var titleEl = document.getElementById("album-title");
          if (titleEl) titleEl.textContent = "Không tìm thấy album";
          var actionsEl = document.querySelector(".album-actions");
          if (actionsEl) actionsEl.hidden = true;
          if (notFound) notFound.hidden = false;
          return;
        }

        renderAlbum(album);
        initLightbox(album);
        initSlideshow(album);
        initCopyLink();
      })
      .catch(function (err) {
        if (grid) {
          grid.innerHTML = "<p class='empty-state'>Không tải được dữ liệu album. " + TM.escape(err.message) + "</p>";
        }
      });

    function renderAlbum(album) {
      document.title = album.title + " | Tessa Morgan — Wedding Photographer";

      var catEl = document.getElementById("album-category");
      if (catEl) catEl.textContent = album.category;

      var titleEl = document.getElementById("album-title");
      if (titleEl) titleEl.textContent = album.title;

      var metaEl = document.getElementById("album-meta");
      if (metaEl) {
        metaEl.textContent = (album.location || "") + " · " + TM.formatDate(album.date) + " · " + (album.images ? album.images.length : 0) + " khung hình nghệ thuật";
      }

      /* Render narrative storytelling dài 180-250 từ */
      if (storyContainer) {
        var storyHtml = "";
        if (album.story_content && Array.isArray(album.story_content)) {
          storyHtml = album.story_content.map(function (p) {
            return "<p>" + TM.escape(p) + "</p>";
          }).join("");
        } else if (album.description) {
          storyHtml = "<p>" + TM.escape(album.description) + "</p>";
        }

        var tagsHtml = "";
        if (album.tags && album.tags.length) {
          tagsHtml = '<div class="album-tags-wrap">' +
            album.tags.map(function (t) {
              return '<span class="tag-badge">#' + TM.escape(t) + '</span>';
            }).join("") +
          '</div>';
        }

        storyContainer.innerHTML = (
          '<div class="album-story-card reveal is-visible">' +
            '<h3 class="album-story-title">Câu Chuyện &amp; Lời Thề Nguyện</h3>' +
            '<div class="album-story-body">' + storyHtml + '</div>' +
            tagsHtml +
          '</div>'
        );
      }

      /* Render lưới ảnh */
      if (grid && album.images) {
        grid.innerHTML = album.images
          .map(function (img, i) {
            var w = img.width || 1200;
            var h = img.height || 800;
            return (
              '<div class="masonry-item reveal is-visible">' +
                '<button type="button" class="tile-btn" data-index="' + i + '"' +
                  ' aria-label="Phóng to: ' + TM.escape(img.alt) + '">' +
                  '<span class="img-frame" style="display:block; ' + frameStyle(w, h) + '">' +
                    '<img src="' + TM.escape(img.src) + '" alt="' + TM.escape(img.alt) + '"' +
                      ' width="' + w + '" height="' + h + '" loading="lazy" decoding="async">' +
                  '</span>' +
                '</button>' +
              '</div>'
            );
          })
          .join("");
      }
    }
  }

  /* ==========================================================
     PHẦN 3 — LIGHTBOX (FOCUS TRAP, PHÍM MŨI TÊN, ESC)
     ========================================================== */
  function initLightbox(album) {
    var modal = document.getElementById("lightbox");
    if (!modal) return;

    var imgEl = document.getElementById("lightbox-img");
    var counterEl = document.getElementById("lightbox-counter");
    var captionEl = document.getElementById("lightbox-caption-text");
    var btnPrev = document.getElementById("lightbox-prev");
    var btnNext = document.getElementById("lightbox-next");
    var btnClose = document.getElementById("lightbox-close");
    var grid = document.getElementById("photo-grid");

    var current = 0;
    var lastFocused = null;

    if (grid) {
      grid.addEventListener("click", function (e) {
        var tile = e.target.closest(".tile-btn");
        if (!tile) return;
        lastFocused = tile;
        open(Number(tile.dataset.index));
      });
    }

    function open(index) {
      show(index);
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.classList.add("no-scroll");
      if (btnClose) btnClose.focus();
      document.addEventListener("keydown", onKeydown);
    }

    function close() {
      modal.classList.remove("is-open");
      modal.hidden = true;
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function show(index) {
      var total = album.images.length;
      current = (index + total) % total;
      var img = album.images[current];
      imgEl.src = img.src;
      imgEl.alt = img.alt;
      imgEl.width = img.width || 1200;
      imgEl.height = img.height || 800;
      if (counterEl) counterEl.textContent = (current + 1) + " / " + total;
      if (captionEl) captionEl.textContent = img.alt;
    }

    function onKeydown(e) {
      if (e.key === "Escape") return close();
      if (e.key === "ArrowLeft") return show(current - 1);
      if (e.key === "ArrowRight") return show(current + 1);
      if (e.key === "Tab") trapFocus(e);
    }

    function trapFocus(e) {
      var focusables = [btnPrev, btnNext, btnClose].filter(Boolean);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    if (btnPrev) btnPrev.addEventListener("click", function () { show(current - 1); });
    if (btnNext) btnNext.addEventListener("click", function () { show(current + 1); });
    if (btnClose) btnClose.addEventListener("click", close);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });
  }

  /* ==========================================================
     PHẦN 4 — SLIDESHOW TOÀN MÀN HÌNH
     ========================================================== */
  function initSlideshow(album) {
    var modal = document.getElementById("slideshow");
    if (!modal) return;

    var imgEl = document.getElementById("slideshow-img");
    var counterEl = document.getElementById("slideshow-counter");
    var statusEl = document.getElementById("slideshow-status");
    var btnOpen = document.getElementById("slideshow-open");
    var btnExit = document.getElementById("slideshow-exit");

    var INTERVAL = 3500;
    var current = 0;
    var timer = null;
    var paused = false;

    if (btnOpen) btnOpen.addEventListener("click", open);
    if (btnExit) btnExit.addEventListener("click", close);

    if (imgEl) {
      imgEl.addEventListener("mouseenter", function () { setPaused(true); });
      imgEl.addEventListener("mouseleave", function () { setPaused(false); });
    }

    function open() {
      current = 0;
      show(current);
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.classList.add("no-scroll");
      if (btnExit) btnExit.focus();
      document.addEventListener("keydown", onKeydown);
      if (!TM.reducedMotion) startTimer();
      else if (statusEl) statusEl.textContent = "Tự chuyển ảnh đã tắt (chế độ giảm chuyển động)";
    }

    function close() {
      stopTimer();
      modal.classList.remove("is-open");
      modal.hidden = true;
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKeydown);
      if (btnOpen) btnOpen.focus();
    }

    function onKeydown(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    }

    function show(index) {
      var total = album.images.length;
      current = (index + total) % total;
      var img = album.images[current];
      imgEl.src = img.src;
      imgEl.alt = img.alt;
      if (counterEl) counterEl.textContent = (current + 1) + " / " + total;
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function () {
        if (!paused) show(current + 1);
      }, INTERVAL);
      if (statusEl) statusEl.textContent = "Đang phát";
    }

    function stopTimer() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function setPaused(value) {
      paused = value;
      if (timer && statusEl) statusEl.textContent = paused ? "Tạm dừng" : "Đang phát";
    }
  }

  /* ==========================================================
     PHẦN 5 — SAO CHÉP LIÊN KẾT ALBUM (CLIPBOARD API)
     ========================================================== */
  function initCopyLink() {
    var btn = document.getElementById("copy-link");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var link = window.location.href;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(link)
          .then(function () {
            TM.toast("Đã sao chép liên kết album vào bộ nhớ tạm!", "success");
          })
          .catch(function () {
            fallbackCopy(link);
          });
      } else {
        fallbackCopy(link);
      }
    });

    function fallbackCopy(text) {
      var input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        TM.toast("Đã sao chép liên kết album vào bộ nhớ tạm!", "success");
      } catch (e) {
        TM.toast("Không thể sao chép — vui lòng copy trực tiếp từ thanh địa chỉ.");
      }
      document.body.removeChild(input);
    }
  }
})();
