/* ==========================================================================
   Tessa Morgan — Wedding Photographer
   blog.js : render blog từ data/blog.json
   - blog.html        : live-search theo từ khóa, lọc chủ đề & phân trang
   - blog-detail.html : render bài viết từ ?post=...
   ========================================================================== */

(function () {
  "use strict";

  var TM = window.TM;
  var PAGE_SIZE = 6;

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("post-grid")) initBlogListPage();
    if (document.getElementById("article")) initBlogDetailPage();
  });

  function postCard(post) {
    var cover = post.cover || "";
    var w = post.coverWidth || 1200;
    var h = post.coverHeight || 800;

    return (
      '<article class="card reveal is-visible">' +
        '<a href="blog-detail.html?post=' + encodeURIComponent(post.id) + '"' +
          ' aria-label="Đọc bài viết: ' + TM.escape(post.title) + '">' +
          '<div class="img-frame" style="aspect-ratio: 3 / 2;">' +
            '<img src="' + TM.escape(cover) + '" alt="' + TM.escape(post.title) + '"' +
              ' width="' + w + '" height="' + h + '" loading="lazy" decoding="async">' +
          "</div>" +
        "</a>" +
        '<div class="card-body">' +
          '<span class="card-meta">' + TM.escape(post.category) + " · " + TM.formatDate(post.date) + "</span>" +
          '<h3><a href="blog-detail.html?post=' + encodeURIComponent(post.id) + '">' + TM.escape(post.title) + "</a></h3>" +
          "<p>" + TM.escape(post.excerpt) + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function initBlogListPage() {
    var grid = document.getElementById("post-grid");
    var emptyState = document.getElementById("blog-empty");
    var filterBar = document.getElementById("blog-filter");
    var searchInput = document.getElementById("blog-search");
    var paginationEl = document.getElementById("blog-pagination");

    var posts = [];
    var state = { category: "all", query: "", page: 1 };

    TM.fetchJSON("data/blog.json")
      .then(function (data) {
        posts = data.posts || [];
        renderFilterButtons(data.categories || []);
        render();
      })
      .catch(function (err) {
        if (grid) grid.innerHTML = "<p class='empty-state'>Không tải được dữ liệu bài viết. " + TM.escape(err.message) + "</p>";
      });

    function renderFilterButtons(categories) {
      if (!filterBar) return;
      var buttons = ['<button type="button" class="filter-btn is-active" data-category="all" aria-pressed="true">Tất Cả</button>'];
      categories.forEach(function (cat) {
        buttons.push(
          '<button type="button" class="filter-btn" data-category="' + TM.escape(cat) + '" aria-pressed="false">' +
            TM.escape(cat) +
          "</button>"
        );
      });
      filterBar.innerHTML = buttons.join("");

      filterBar.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-btn");
        if (!btn) return;
        state.category = btn.dataset.category || "all";
        state.page = 1;
        filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", String(active));
        });
        render();
      });
    }

    var searchTimer = null;
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          state.query = searchInput.value.trim().toLowerCase();
          state.page = 1;
          render();
        }, 200);
      });
    }

    function filteredPosts() {
      return posts.filter(function (post) {
        if (state.category !== "all" && post.category !== state.category) return false;
        if (!state.query) return true;
        var haystack = (
          post.title + " " + post.excerpt + " " + post.category + " " + (post.keywords || []).join(" ")
        ).toLowerCase();
        return haystack.indexOf(state.query) !== -1;
      });
    }

    function render() {
      if (!grid) return;
      var list = filteredPosts();
      var totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (state.page > totalPages) state.page = totalPages;

      var start = (state.page - 1) * PAGE_SIZE;
      var pageItems = list.slice(start, start + PAGE_SIZE);

      if (emptyState) emptyState.hidden = list.length > 0;
      grid.innerHTML = pageItems.map(postCard).join("");
      renderPagination(list.length, totalPages);
    }

    function renderPagination(totalItems, totalPages) {
      if (!paginationEl) return;
      if (totalItems <= PAGE_SIZE) {
        paginationEl.innerHTML = "";
        return;
      }

      var html = [
        '<button type="button" class="page-btn" data-page="prev" aria-label="Trang trước"' +
          (state.page === 1 ? " disabled" : "") + ">&laquo;</button>",
      ];
      for (var i = 1; i <= totalPages; i++) {
        html.push(
          '<button type="button" class="page-btn' + (i === state.page ? " is-active" : "") + '"' +
            ' data-page="' + i + '"' +
            (i === state.page ? ' aria-current="page"' : "") + ">" + i + "</button>"
        );
      }
      html.push(
        '<button type="button" class="page-btn" data-page="next" aria-label="Trang sau"' +
          (state.page === totalPages ? " disabled" : "") + ">&raquo;</button>"
      );
      paginationEl.innerHTML = html.join("");
    }

    if (paginationEl) {
      paginationEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".page-btn");
        if (!btn || btn.disabled) return;
        var value = btn.dataset.page;
        if (value === "prev") state.page -= 1;
        else if (value === "next") state.page += 1;
        else state.page = Number(value);
        render();
        if (grid) grid.scrollIntoView({ behavior: TM.reducedMotion ? "auto" : "smooth", block: "start" });
      });
    }
  }

  function initBlogDetailPage() {
    var article = document.getElementById("article");
    var notFound = document.getElementById("post-notfound");

    TM.fetchJSON("data/blog.json")
      .then(function (data) {
        var id = new URLSearchParams(window.location.search).get("post");
        var posts = data.posts || [];
        var post = posts.filter(function (p) { return p.id === id; })[0] || null;

        if (!post) {
          if (article) article.hidden = true;
          if (notFound) notFound.hidden = false;
          return;
        }
        renderPost(post);
        renderRelated(posts, post);
      })
      .catch(function (err) {
        if (article) article.innerHTML = "<p class='empty-state'>Không tải được bài viết. " + TM.escape(err.message) + "</p>";
      });

    function renderPost(post) {
      document.title = post.title + " | Tessa Morgan — Wedding Photographer";
      var metaEl = document.getElementById("article-meta");
      if (metaEl) {
        metaEl.innerHTML =
          "<span>" + TM.escape(post.category) + "</span>" +
          "<span>" + TM.formatDate(post.date) + "</span>" +
          "<span>" + TM.escape(post.author) + "</span>" +
          "<span>" + post.readTime + " phút đọc</span>";
      }

      var titleEl = document.getElementById("article-title");
      if (titleEl) titleEl.textContent = post.title;

      var frame = document.getElementById("article-cover-frame");
      var cover = document.getElementById("article-cover");
      if (frame && cover) {
        var w = post.coverWidth || 1200;
        var h = post.coverHeight || 800;
        frame.style.aspectRatio = w + " / " + h;
        cover.src = post.cover;
        cover.alt = post.title;
        cover.width = w;
        cover.height = h;
        frame.hidden = false;
      }

      var bodyEl = document.getElementById("article-body");
      if (bodyEl && post.content) {
        bodyEl.innerHTML = post.content
          .map(function (paragraph) { return "<p>" + TM.escape(paragraph) + "</p>"; })
          .join("");
      }

      var kwEl = document.getElementById("article-keywords");
      if (kwEl && post.keywords) {
        kwEl.innerHTML = post.keywords
          .map(function (kw) { return "<span class='tag-badge'>#" + TM.escape(kw) + "</span>"; })
          .join("");
      }
    }

    function renderRelated(posts, current) {
      var related = posts
        .filter(function (p) { return p.id !== current.id && p.category === current.category; })
        .slice(0, 3);
      if (related.length < 3) {
        posts.forEach(function (p) {
          if (related.length >= 3) return;
          if (p.id !== current.id && related.indexOf(p) === -1) related.push(p);
        });
      }
      if (!related.length) return;
      var relGrid = document.getElementById("related-grid");
      var relSec = document.getElementById("related-section");
      if (relGrid) relGrid.innerHTML = related.map(postCard).join("");
      if (relSec) relSec.hidden = false;
    }
  }
})();
