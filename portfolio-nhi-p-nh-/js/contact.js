/* ==========================================================================
   Tessa Morgan — Wedding Photographer
   contact.js : Tự động điền gói chụp từ URL & kiểm tra dữ liệu biểu mẫu
   ========================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var fields = {
      name: document.getElementById("name"),
      email: document.getElementById("email"),
      phone: document.getElementById("phone"),
      package: document.getElementById("package"),
      message: document.getElementById("message"),
    };

    autofillPackage(fields.package);
    bindInlineValidation(fields);
    bindSubmit(form, fields);
  });

  function autofillPackage(select) {
    var param = new URLSearchParams(window.location.search).get("package");
    if (!param || !select) return;

    var wanted = normalize(param);
    var matched = false;

    Array.prototype.forEach.call(select.options, function (opt) {
      if (!matched && opt.value) {
        var optVal = normalize(opt.value);
        var optTxt = normalize(opt.text);
        if (
          optVal === wanted ||
          optTxt === wanted ||
          optVal.indexOf(wanted) !== -1 ||
          wanted.indexOf(optVal) !== -1 ||
          optTxt.indexOf(wanted) !== -1 ||
          wanted.indexOf(optTxt) !== -1 ||
          (wanted.indexOf("399") !== -1 && optVal.indexOf("399") !== -1) ||
          (wanted.indexOf("799") !== -1 && optVal.indexOf("799") !== -1) ||
          (wanted.indexOf("1999") !== -1 && optVal.indexOf("1999") !== -1) ||
          (wanted.indexOf("2999") !== -1 && optVal.indexOf("2999") !== -1)
        ) {
          select.value = opt.value;
          matched = true;
        }
      }
    });

    if (matched) {
      window.TM.toast("Đã tự động chọn gói: " + select.options[select.selectedIndex].text, "success");
      var wrap = select.closest(".form-field");
      if (wrap) {
        wrap.scrollIntoView({
          behavior: window.TM.reducedMotion ? "auto" : "smooth",
          block: "center",
        });
      }
    }
  }

  function normalize(str) {
    return String(str).replace(/\s+/g, " ").trim().toUpperCase();
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var validators = {
    name: function (value) {
      if (!value.trim()) return "Vui lòng nhập họ và tên của bạn.";
      if (value.trim().length < 2) return "Họ tên cần có ít nhất 2 ký tự.";
      return "";
    },
    email: function (value) {
      if (!value.trim()) return "Vui lòng nhập địa chỉ email.";
      if (!EMAIL_RE.test(value.trim())) return "Định dạng email chưa hợp lệ (ví dụ: ban@domain.com).";
      return "";
    },
    phone: function (value) {
      if (value && value.trim().length > 0 && value.trim().length < 9) {
        return "Số điện thoại cần có ít nhất 9 chữ số.";
      }
      return "";
    },
    package: function () {
      return "";
    },
    message: function (value) {
      if (!value.trim()) return "Vui lòng chia sẻ đôi lời về ngày trọng đại của bạn.";
      if (value.trim().length < 10) return "Lời nhắn cần ít nhất 10 ký tự để Tessa có thể tư vấn tốt nhất.";
      return "";
    },
  };

  function showError(input, message) {
    if (!input) return;
    var wrap = input.closest(".form-field");
    var errorEl = document.getElementById(input.id + "-error");
    if (wrap) wrap.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message;
  }

  function validateField(input) {
    if (!input) return true;
    var check = validators[input.name] || function () { return ""; };
    var message = check(input.value);
    showError(input, message);
    return !message;
  }

  function bindInlineValidation(fields) {
    Object.keys(fields).forEach(function (key) {
      var input = fields[key];
      if (!input) return;

      input.addEventListener("blur", function () {
        validateField(input);
      });

      input.addEventListener("input", function () {
        var wrap = input.closest(".form-field");
        if (wrap && wrap.classList.contains("has-error")) {
          validateField(input);
        }
      });
    });
  }

  function bindSubmit(form, fields) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var firstInvalid = null;
      Object.keys(fields).forEach(function (key) {
        var input = fields[key];
        if (input && !validateField(input) && !firstInvalid) {
          firstInvalid = input;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        window.TM.toast("Vui lòng hoàn thiện các trường thông tin được đánh dấu đỏ.");
        return;
      }

      window.TM.toast("Trân trọng cảm ơn bạn! Tessa sẽ liên hệ phản hồi trong vòng 24 giờ tới.", "success");
      form.reset();
      Object.keys(fields).forEach(function (key) {
        if (fields[key]) showError(fields[key], "");
      });
    });
  }
})();
