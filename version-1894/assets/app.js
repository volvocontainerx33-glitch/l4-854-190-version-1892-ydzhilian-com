import { H as Hls } from "./hls-vendor.js";

const rootBase = document.body.dataset.base || "";

function initMobileMenu() {
  const button = document.querySelector(".mobile-toggle");
  const panel = document.querySelector(".mobile-panel");
  if (!button || !panel) {
    return;
  }
  button.addEventListener("click", () => {
    const opened = panel.classList.toggle("is-open");
    button.setAttribute("aria-expanded", opened ? "true" : "false");
    button.textContent = opened ? "×" : "☰";
  });
}

function initHeroSlider() {
  const slider = document.querySelector("[data-hero]");
  if (!slider) {
    return;
  }
  const slides = Array.from(slider.querySelectorAll(".hero-slide"));
  const dots = Array.from(slider.querySelectorAll(".hero-dot"));
  if (slides.length === 0) {
    return;
  }
  let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  };
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      show(Number(dot.dataset.slide || 0));
    });
  });
  window.setInterval(() => show(current + 1), 5200);
}

function initCategoryFilters() {
  const list = document.querySelector(".category-list");
  const filterBar = document.querySelector(".filter-bar");
  if (!list || !filterBar) {
    return;
  }
  const cards = Array.from(list.querySelectorAll(".movie-card"));
  const input = filterBar.querySelector(".filter-input");
  const type = filterBar.querySelector(".filter-type");
  const year = filterBar.querySelector(".filter-year");
  const region = filterBar.querySelector(".filter-region");
  const apply = () => {
    const keyword = (input?.value || "").trim().toLowerCase();
    const selectedType = type?.value || "";
    const selectedYear = year?.value || "";
    const selectedRegion = region?.value || "";
    cards.forEach((card) => {
      const haystack = (card.dataset.title || "").toLowerCase();
      const okKeyword = !keyword || haystack.includes(keyword);
      const okType = !selectedType || card.dataset.type === selectedType;
      const okYear = !selectedYear || card.dataset.year === selectedYear;
      const okRegion = !selectedRegion || card.dataset.region === selectedRegion;
      card.style.display = okKeyword && okType && okYear && okRegion ? "" : "none";
    });
  };
  [input, type, year, region].forEach((element) => {
    if (element) {
      element.addEventListener("input", apply);
      element.addEventListener("change", apply);
    }
  });
}

function createSearchCard(movie) {
  const article = document.createElement("article");
  article.className = "movie-card";
  article.innerHTML = `
    <a class="poster-frame" href="${rootBase}${movie.url}" aria-label="${escapeHtml(movie.title)}">
      <img src="${rootBase}${movie.image}" alt="${escapeHtml(movie.title)}" loading="lazy">
      <span class="poster-gradient"></span>
      <span class="play-chip">▶</span>
      <span class="poster-meta">${escapeHtml(movie.year)} · ${escapeHtml(movie.type)}</span>
    </a>
    <div class="card-body">
      <a class="card-title" href="${rootBase}${movie.url}">${escapeHtml(movie.title)}</a>
      <p>${escapeHtml(movie.description)}</p>
      <div class="card-tags">${movie.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="card-stats">
        <span>${escapeHtml(movie.genre)}</span>
        <span>${escapeHtml(movie.category)}</span>
      </div>
    </div>
  `;
  return article;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initSearchPage() {
  const results = document.getElementById("search-results");
  const note = document.getElementById("search-result-note");
  const input = document.getElementById("search-page-input");
  if (!results || !note || !Array.isArray(window.SITE_MOVIES)) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  if (input) {
    input.value = query;
  }
  const normalized = query.toLowerCase();
  const source = window.SITE_MOVIES;
  const matched = normalized
    ? source.filter((movie) => movie.search.toLowerCase().includes(normalized)).slice(0, 120)
    : source.slice(0, 36);
  results.textContent = "";
  matched.forEach((movie) => results.appendChild(createSearchCard(movie)));
  note.textContent = normalized ? `与“${query}”相关的影片如下。` : "可浏览近期推荐，也可以输入关键词搜索。";
}

function initPlayer() {
  const video = document.getElementById("movie-player");
  const overlay = document.getElementById("play-overlay");
  const dataEl = document.getElementById("movie-player-data");
  if (!video || !overlay || !dataEl) {
    return;
  }
  let data;
  try {
    data = JSON.parse(dataEl.textContent || "{}");
  } catch (error) {
    data = {};
  }
  const videoUrl = data.videoUrl || "";
  let attached = false;
  let hls = null;
  const attach = () => {
    if (attached || !videoUrl) {
      return;
    }
    attached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      return;
    }
    if (Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      return;
    }
    video.src = videoUrl;
  };
  const start = () => {
    attach();
    overlay.classList.add("is-hidden");
    video.play().catch(() => {
      overlay.classList.remove("is-hidden");
    });
  };
  overlay.addEventListener("click", start);
  video.addEventListener("click", () => {
    if (video.paused) {
      start();
    }
  });
  video.addEventListener("play", () => overlay.classList.add("is-hidden"));
  video.addEventListener("pause", () => {
    if (video.currentTime === 0 || video.ended) {
      overlay.classList.remove("is-hidden");
    }
  });
  window.addEventListener("beforeunload", () => {
    if (hls) {
      hls.destroy();
    }
  });
}

initMobileMenu();
initHeroSlider();
initCategoryFilters();
initSearchPage();
initPlayer();
