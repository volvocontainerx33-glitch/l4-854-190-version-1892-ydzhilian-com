(function () {
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-site-nav]');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }
        function play() {
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
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                play();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function initSearchForm() {
        var form = document.querySelector('[data-site-search]');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var input = form.querySelector('input[name="q"]');
            var q = input ? input.value.trim() : '';
            var url = './search.html';
            if (q) {
                url += '?q=' + encodeURIComponent(q);
            }
            window.location.href = url;
        });
    }

    function initFilters() {
        var panel = document.querySelector('[data-filter-panel]');
        var grid = document.querySelector('[data-card-grid]');
        if (!panel || !grid) {
            return;
        }
        var input = panel.querySelector('[data-filter-input]');
        var yearSelect = panel.querySelector('[data-filter-year]');
        var categorySelect = panel.querySelector('[data-filter-category]');
        var chips = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-genre]'));
        var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));
        var empty = document.querySelector('[data-empty-state]');
        var currentGenre = '';
        if (panel.hasAttribute('data-sync-query') && input) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get('q') || '';
            input.value = q;
        }
        function apply() {
            var term = input ? input.value.trim().toLowerCase() : '';
            var year = yearSelect ? yearSelect.value : '';
            var category = categorySelect ? categorySelect.value : '';
            var visible = 0;
            cards.forEach(function (card) {
                var searchText = (card.getAttribute('data-search') || '').toLowerCase();
                var cardYear = card.getAttribute('data-year') || '';
                var cardGenre = card.getAttribute('data-genre') || '';
                var cardCategory = card.getAttribute('data-category') || '';
                var ok = true;
                if (term && searchText.indexOf(term) === -1) {
                    ok = false;
                }
                if (year && cardYear !== year) {
                    ok = false;
                }
                if (category && cardCategory !== category) {
                    ok = false;
                }
                if (currentGenre && cardGenre.indexOf(currentGenre) === -1 && searchText.indexOf(currentGenre.toLowerCase()) === -1) {
                    ok = false;
                }
                card.classList.toggle('is-hidden', !ok);
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }
        if (input) {
            input.addEventListener('input', apply);
        }
        if (yearSelect) {
            yearSelect.addEventListener('change', apply);
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', apply);
        }
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                currentGenre = chip.getAttribute('data-filter-genre') || '';
                chips.forEach(function (item) {
                    item.classList.toggle('is-active', item === chip);
                });
                apply();
            });
        });
        apply();
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        players.forEach(function (player) {
            var video = player.querySelector('video');
            var overlay = player.querySelector('.player-overlay');
            var source = player.getAttribute('data-src') || '';
            var started = false;
            var hls = null;
            if (!video || !source) {
                return;
            }
            function begin() {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
                if (started) {
                    var replay = video.play();
                    if (replay && replay.catch) {
                        replay.catch(function () {});
                    }
                    return;
                }
                started = true;
                video.controls = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    var nativePlay = video.play();
                    if (nativePlay && nativePlay.catch) {
                        nativePlay.catch(function () {});
                    }
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hls.attachMedia(video);
                    hls.loadSource(source);
                    var hlsStart = video.play();
                    if (hlsStart && hlsStart.catch) {
                        hlsStart.catch(function () {});
                    }
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        var hlsPlay = video.play();
                        if (hlsPlay && hlsPlay.catch) {
                            hlsPlay.catch(function () {});
                        }
                    });
                    return;
                }
                video.src = source;
                var fallbackPlay = video.play();
                if (fallbackPlay && fallbackPlay.catch) {
                    fallbackPlay.catch(function () {});
                }
            }
            if (overlay) {
                overlay.addEventListener('click', begin);
            }
            video.addEventListener('click', function () {
                if (!started || video.paused) {
                    begin();
                }
            });
            window.addEventListener('beforeunload', function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initSearchForm();
        initFilters();
        initPlayers();
    });
})();
