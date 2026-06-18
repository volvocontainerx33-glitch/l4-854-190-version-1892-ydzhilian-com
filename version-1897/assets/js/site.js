(function () {
  var body = document.body;
  var rootPrefix = body ? body.getAttribute("data-root-prefix") || "" : "";

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "00:00";
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }


  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function initMenu() {
    var toggle = $("[data-menu-toggle]");
    var panel = $("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      toggle.textContent = panel.classList.contains("is-open") ? "×" : "☰";
    });
  }

  function initHero() {
    var carousel = $("[data-hero-carousel]");
    if (!carousel) {
      return;
    }
    var slides = $all("[data-hero-slide]", carousel);
    var dots = $all("[data-hero-dot]", carousel);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var next = parseInt(dot.getAttribute("data-hero-dot"), 10) || 0;
        show(next);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function initCardFilter() {
    var input = $("[data-card-filter]");
    var list = $("[data-card-list]");
    if (!input || !list) {
      return;
    }
    var cards = $all("[data-search]", list);
    var chips = $all("[data-chip]");
    var chipValue = "";

    function apply() {
      var query = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-search") || "").toLowerCase();
        var matchedQuery = !query || text.indexOf(query) !== -1;
        var matchedChip = !chipValue || text.indexOf(chipValue.toLowerCase()) !== -1;
        card.classList.toggle("is-hidden", !(matchedQuery && matchedChip));
      });
    }

    input.addEventListener("input", apply);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (item) {
          item.classList.remove("is-active");
        });
        chip.classList.add("is-active");
        chipValue = chip.getAttribute("data-chip") || "";
        apply();
      });
    });
  }

  function initSearchOverlay() {
    var overlay = $("[data-search-overlay]");
    var closeButton = $("[data-search-close]");
    var overlayInput = $("[data-overlay-search-input]");
    var results = $("[data-search-results]");
    var forms = $all(".site-search-form");
    var index = typeof MOVIE_SEARCH_INDEX !== "undefined" ? MOVIE_SEARCH_INDEX : [];

    if (!overlay || !overlayInput || !results) {
      return;
    }

    function itemUrl(item) {
      return rootPrefix + item.url;
    }

    function imageUrl(item) {
      return rootPrefix + item.image;
    }

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        results.innerHTML = "<div class=\"search-empty\">输入关键词后显示影片结果</div>";
        return;
      }
      var matches = index.filter(function (item) {
        return item.search.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 24);
      if (!matches.length) {
        results.innerHTML = "<div class=\"search-empty\">没有找到匹配影片</div>";
        return;
      }
      results.innerHTML = matches.map(function (item) {
        var title = escapeHtml(item.title);
        var year = escapeHtml(item.year);
        var region = escapeHtml(item.region);
        var genre = escapeHtml(item.genre);
        return "<a class=\"search-result\" href=\"" + itemUrl(item) + "\">" +
          "<img src=\"" + imageUrl(item) + "\" alt=\"" + title + "\">" +
          "<span><strong>" + title + "</strong><span>" + year + " · " + region + " · " + genre + "</span></span>" +
          "</a>";
      }).join("");
    }

    function open(query) {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      overlayInput.value = query || "";
      render(overlayInput.value);
      window.setTimeout(function () {
        overlayInput.focus();
      }, 30);
    }

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
    }

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = $(".site-search-input", form);
        open(input ? input.value : "");
      });
    });

    overlayInput.addEventListener("input", function () {
      render(overlayInput.value);
    });

    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        close();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        close();
      }
    });
  }

  function initPlayers() {
    $all(".video-shell").forEach(function (shell) {
      var video = $(".js-video-player", shell);
      var playButton = $(".video-play-button", shell);
      var toggleButton = $(".video-toggle", shell);
      var progress = $(".video-progress", shell);
      var timeLabel = $(".video-time", shell);
      var muteButton = $(".video-mute", shell);
      var fullscreenButton = $(".video-fullscreen", shell);
      var source = shell.getAttribute("data-video-url") || "";
      var seeking = false;

      if (!video || !source) {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      }

      function updateState() {
        var playing = !video.paused && !video.ended;
        shell.classList.toggle("is-playing", playing);
        if (toggleButton) {
          toggleButton.textContent = playing ? "暂停" : "播放";
        }
      }

      function togglePlay() {
        if (video.paused || video.ended) {
          video.play();
        } else {
          video.pause();
        }
      }

      function updateProgress() {
        if (!seeking && progress && Number.isFinite(video.duration) && video.duration > 0) {
          progress.value = String((video.currentTime / video.duration) * 100);
        }
        if (timeLabel) {
          timeLabel.textContent = formatTime(video.currentTime) + " / " + formatTime(video.duration);
        }
      }

      if (playButton) {
        playButton.addEventListener("click", togglePlay);
      }
      if (toggleButton) {
        toggleButton.addEventListener("click", togglePlay);
      }
      video.addEventListener("click", togglePlay);
      video.addEventListener("play", updateState);
      video.addEventListener("pause", updateState);
      video.addEventListener("ended", updateState);
      video.addEventListener("timeupdate", updateProgress);
      video.addEventListener("loadedmetadata", updateProgress);

      if (progress) {
        progress.addEventListener("input", function () {
          seeking = true;
          if (Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = (parseFloat(progress.value) / 100) * video.duration;
          }
          seeking = false;
        });
      }

      if (muteButton) {
        muteButton.addEventListener("click", function () {
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? "取消静音" : "静音";
        });
      }

      if (fullscreenButton) {
        fullscreenButton.addEventListener("click", function () {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (shell.requestFullscreen) {
            shell.requestFullscreen();
          }
        });
      }

      updateState();
      updateProgress();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHero();
    initCardFilter();
    initSearchOverlay();
    initPlayers();
  });
})();
