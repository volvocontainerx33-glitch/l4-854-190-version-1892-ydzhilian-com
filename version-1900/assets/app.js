(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function initHero() {
        var root = document.querySelector('[data-hero]');
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var next = Number(dot.getAttribute('data-hero-dot')) || 0;
                show(next);
                start();
            });
        });
        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-list]'));
        scopes.forEach(function (scope) {
            var input = scope.querySelector('[data-search-input]');
            var chips = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-chip]'));
            var containers = Array.prototype.slice.call(scope.querySelectorAll('[data-card-container]'));
            var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
            var activeChip = '';

            if (!input && !chips.length) {
                return;
            }

            containers.forEach(function (container) {
                container.classList.add('has-filtering');
            });

            function apply() {
                var query = input ? input.value.trim().toLowerCase() : '';
                cards.forEach(function (card) {
                    var haystack = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
                    var matchedQuery = !query || haystack.indexOf(query) !== -1;
                    var matchedChip = !activeChip || haystack.indexOf(activeChip.toLowerCase()) !== -1;
                    card.classList.toggle('is-hidden', !(matchedQuery && matchedChip));
                });
            }

            if (input) {
                input.addEventListener('input', apply);
            }
            chips.forEach(function (chip) {
                chip.addEventListener('click', function () {
                    activeChip = chip.getAttribute('data-filter-chip') || '';
                    chips.forEach(function (item) {
                        item.classList.toggle('is-active', item === chip);
                    });
                    apply();
                });
            });
            apply();
        });
    }

    window.initPlayer = function (videoId, buttonId, url) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        if (!video || !button || !url) {
            return;
        }
        var started = false;
        var hls = null;

        function attemptPlay() {
            var playResult = video.play();
            if (playResult && typeof playResult.catch === 'function') {
                playResult.catch(function () {});
            }
        }

        function load() {
            if (started) {
                attemptPlay();
                return;
            }
            started = true;
            button.classList.add('is-hidden');
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                video.addEventListener('loadedmetadata', attemptPlay, { once: true });
                video.load();
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, attemptPlay);
                return;
            }
            video.src = url;
            video.load();
            attemptPlay();
        }

        button.addEventListener('click', load);
        video.addEventListener('click', function () {
            if (!started) {
                load();
            }
        });
        window.addEventListener('pagehide', function () {
            if (hls && typeof hls.destroy === 'function') {
                hls.destroy();
            }
        });
    };

    ready(function () {
        initMenu();
        initHero();
        initFilters();
    });
})();
