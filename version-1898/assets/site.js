(function () {
    var menuButton = document.querySelector(".menu-toggle");
    var mobileNav = document.querySelector(".mobile-nav");

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", function () {
            var open = mobileNav.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var activeIndex = 0;
    var heroTimer = null;

    function setHero(index) {
        if (!slides.length) {
            return;
        }
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === activeIndex);
        });
    }

    function startHero() {
        if (heroTimer) {
            clearInterval(heroTimer);
        }
        if (slides.length > 1) {
            heroTimer = setInterval(function () {
                setHero(activeIndex + 1);
            }, 5000);
        }
    }

    dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
            setHero(Number(dot.getAttribute("data-hero-dot")) || 0);
            startHero();
        });
    });

    startHero();

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function applyFilter(input) {
        var root = input.closest(".section-block") || document;
        var query = normalize(input.value);
        var cards = Array.prototype.slice.call(root.querySelectorAll(".movie-card"));
        var shown = 0;

        cards.forEach(function (card) {
            var haystack = normalize([
                card.getAttribute("data-title"),
                card.getAttribute("data-region"),
                card.getAttribute("data-year"),
                card.getAttribute("data-tags"),
                card.getAttribute("data-category")
            ].join(" "));
            var match = !query || haystack.indexOf(query) !== -1;
            card.classList.toggle("is-filtered", !match);
            if (match) {
                shown += 1;
            }
        });

        var oldEmpty = root.querySelector(".empty-state");
        if (oldEmpty) {
            oldEmpty.remove();
        }
        if (!shown && cards.length) {
            var empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = "没有找到匹配内容";
            var grid = root.querySelector(".movie-grid, .ranking-list");
            if (grid) {
                grid.appendChild(empty);
            }
        }
    }

    Array.prototype.slice.call(document.querySelectorAll(".movie-search")).forEach(function (input) {
        input.addEventListener("input", function () {
            applyFilter(input);
        });
        var panel = input.closest(".filter-panel");
        if (panel) {
            Array.prototype.slice.call(panel.querySelectorAll("[data-filter-key]")).forEach(function (button) {
                button.addEventListener("click", function () {
                    input.value = button.getAttribute("data-filter-key") || "";
                    applyFilter(input);
                    input.focus();
                });
            });
        }
    });
})();

function bindPlayer(videoId, buttonId, overlayId, streamUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var overlay = document.getElementById(overlayId);
    var attached = false;
    var hls = null;

    if (!video || !button || !streamUrl) {
        return;
    }

    function attachStream() {
        if (attached) {
            return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: false
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
    }

    function playMovie() {
        attachStream();
        button.classList.add("is-hidden");
        if (overlay) {
            overlay.classList.add("is-hidden");
        }
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
                button.classList.remove("is-hidden");
                if (overlay) {
                    overlay.classList.remove("is-hidden");
                }
            });
        }
    }

    button.addEventListener("click", playMovie);
    video.addEventListener("click", function () {
        if (video.paused) {
            playMovie();
        }
    });
    video.addEventListener("play", function () {
        button.classList.add("is-hidden");
    });
    video.addEventListener("ended", function () {
        button.classList.remove("is-hidden");
    });
    window.addEventListener("beforeunload", function () {
        if (hls) {
            hls.destroy();
        }
    });
}
