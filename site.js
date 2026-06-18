document.addEventListener("DOMContentLoaded", function () {
  var menuButton = document.querySelector(".menu-toggle");
  var mobilePanel = document.querySelector(".mobile-panel");

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", function () {
      var isOpen = mobilePanel.hasAttribute("hidden") === false;
      if (isOpen) {
        mobilePanel.setAttribute("hidden", "");
        menuButton.setAttribute("aria-expanded", "false");
      } else {
        mobilePanel.removeAttribute("hidden");
        menuButton.setAttribute("aria-expanded", "true");
      }
    });
  }

  var hero = document.querySelector(".hero");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var current = 0;

    function setSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        setSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }
  }

  document.querySelectorAll("[data-scroll-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.querySelector(button.getAttribute("data-scroll-target"));
      if (!target) {
        return;
      }
      var direction = button.getAttribute("data-direction") === "left" ? -1 : 1;
      target.scrollBy({ left: direction * 420, behavior: "smooth" });
    });
  });

  var filterInput = document.querySelector("[data-filter-input]");
  var filterSelect = document.querySelector("[data-filter-select]");
  var filterCards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));

  function applyFilter() {
    var keyword = filterInput ? filterInput.value.trim().toLowerCase() : "";
    var selected = filterSelect ? filterSelect.value : "";

    filterCards.forEach(function (card) {
      var haystack = [
        card.getAttribute("data-title"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-region"),
        card.getAttribute("data-year")
      ].join(" ").toLowerCase();
      var matchesKeyword = keyword === "" || haystack.indexOf(keyword) !== -1;
      var matchesSelected = selected === "" || haystack.indexOf(selected.toLowerCase()) !== -1;
      card.style.display = matchesKeyword && matchesSelected ? "" : "none";
    });
  }

  if (filterInput) {
    filterInput.addEventListener("input", applyFilter);
  }
  if (filterSelect) {
    filterSelect.addEventListener("change", applyFilter);
  }

  var searchRoot = document.querySelector("[data-search-results]");
  if (searchRoot && window.movieSearchIndex) {
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    var searchInput = document.querySelector("[data-search-page-input]");
    if (searchInput) {
      searchInput.value = query;
    }

    function renderSearch(value) {
      var term = value.trim().toLowerCase();
      var matches = window.movieSearchIndex.filter(function (movie) {
        var text = [movie.title, movie.genre, movie.region, movie.year, movie.type, movie.oneLine].join(" ").toLowerCase();
        return term !== "" && text.indexOf(term) !== -1;
      }).slice(0, 80);

      if (matches.length === 0) {
        searchRoot.innerHTML = '<div class="search-results-empty">请输入片名、地区、年份或类型关键词进行检索。</div>';
        return;
      }

      searchRoot.innerHTML = matches.map(function (movie) {
        return '<article class="movie-card">' +
          '<a class="poster-link" href="./' + movie.url + '">' +
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
          '<span class="poster-play">▶</span>' +
          '</a>' +
          '<div class="movie-card-body">' +
          '<div class="movie-card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>' +
          '<h3><a href="./' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>' +
          '<p>' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="card-bottom"><span class="score">★ ' + escapeHtml(movie.rating) + '</span><a href="./' + movie.url + '">立即观看</a></div>' +
          '</div>' +
          '</article>';
      }).join("");
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>'"]/g, function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;"
        }[character];
      });
    }

    renderSearch(query);
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        renderSearch(searchInput.value);
      });
    }
  }
});
