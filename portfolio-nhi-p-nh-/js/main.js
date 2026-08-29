/* ==========================================================================
   Tessa Morgan — Wedding Photographer
   main.js : tiện ích chung, mobile nav, scroll-to-top, parallax & reveal
   Dùng chung cho toàn bộ các trang (nạp trước các script trang riêng).
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Namespace tiện ích chia sẻ giữa các script ---------- */
  var TM = (window.TM = window.TM || {});

  /* Trang nằm ở gốc (index.html) hay trong /pages/ ?
     Dùng để nối đường dẫn tương đối tới data/ và images/. */
  TM.base = /\/pages\//.test(window.location.pathname) ? "../" : "./";

  /* Người dùng có bật chế độ giảm chuyển động không? */
  TM.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- fetch JSON (có cache trong phiên) ---------- */
  var jsonCache = {};
  TM.fetchJSON = function (relPath) {
    if (jsonCache[relPath]) return jsonCache[relPath];
    jsonCache[relPath] = fetch(TM.base + relPath).then(function (res) {
      if (!res.ok) throw new Error("Không tải được dữ liệu " + relPath + " (" + res.status + ")");
      return res.json();
    });
    return jsonCache[relPath];
  };

  /* ---------- Escape HTML khi render dữ liệu động ---------- */
  TM.escape = function (str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- Toast thông báo dùng chung ---------- */
  var toastEl = null;
  var toastTimer = null;
  TM.toast = function (message, type) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.toggle("toast-success", type === "success");
    /* Kích hoạt lại animation */
    toastEl.classList.remove("is-visible");
    void toastEl.offsetWidth;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 3200);
  };

  /* ---------- Định dạng ngày (vi-VN) ---------- */
  TM.formatDate = function (iso) {
    try {
      return new Date(iso + "T00:00:00").toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return iso;
    }
  };

  /* ==========================================================
     Các hành vi UI chung — chạy sau khi DOM sẵn sàng
     ========================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initActiveNav();
    initScrollTop();
    initReveal();
    initParallax();
    initFooterYear();
  });

  /* ---------- Mobile navigation (hamburger) ---------- */
  function initMobileNav() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    });

    /* Đóng menu khi chọn một liên kết */
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Đánh dấu trang hiện tại trên menu ---------- */
  function initActiveNav() {
    var current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach(function (link) {
      var target = (link.getAttribute("href") || "").split("/").pop().split("?")[0];
      if (target === current) link.setAttribute("aria-current", "page");
    });
  }

  /* ---------- Nút cuộn lên đầu trang ---------- */
  function initScrollTop() {
    var btn = document.createElement("button");
    btn.className = "scroll-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Cuộn lên đầu trang");
    btn.innerHTML = "&uarr;";
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: TM.reducedMotion ? "auto" : "smooth" });
    });

    var onScroll = function () {
      btn.classList.toggle("is-visible", window.scrollY > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    /* Giảm chuyển động → hiển thị ngay, không animate */
    if (TM.reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Parallax nhẹ cho hero ---------- */
  function initParallax() {
    var bg = document.querySelector(".hero-bg");
    if (!bg || TM.reducedMotion) return;

    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          bg.style.transform = "translateY(" + window.scrollY * 0.22 + "px)";
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Năm hiện tại ở footer ---------- */
  function initFooterYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }
})();
