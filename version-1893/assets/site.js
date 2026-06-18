(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileMenu = document.querySelector('[data-mobile-menu]');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('is-open');
            document.body.classList.toggle('menu-open', mobileMenu.classList.contains('is-open'));
        });
    }

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var previousButton = hero.querySelector('[data-hero-prev]');
        var nextButton = hero.querySelector('[data-hero-next]');
        var activeIndex = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === activeIndex);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === activeIndex);
            });
        }

        function restartTimer() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                showSlide(activeIndex + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
                restartTimer();
            });
        });

        if (previousButton) {
            previousButton.addEventListener('click', function () {
                showSlide(activeIndex - 1);
                restartTimer();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                showSlide(activeIndex + 1);
                restartTimer();
            });
        }

        restartTimer();
    }

    var filterInput = document.querySelector('[data-page-filter]');

    if (filterInput) {
        var queryInput = document.querySelector('[data-query-input]');
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q') || '';

        if (queryInput && initialQuery) {
            queryInput.value = initialQuery;
        }

        function filterCards() {
            var value = filterInput.value.trim().toLowerCase();
            var cards = document.querySelectorAll('[data-card]');

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title') || '',
                    card.getAttribute('data-tags') || '',
                    card.textContent || ''
                ].join(' ').toLowerCase();

                card.classList.toggle('is-hidden', value && haystack.indexOf(value) === -1);
            });
        }

        filterInput.addEventListener('input', filterCards);
        filterCards();
    }

    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    if (players.length) {
        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            var stream = video ? video.getAttribute('data-stream') : '';
            var hlsInstance = null;
            var prepared = false;

            function loadHlsLibrary() {
                return new Promise(function (resolve, reject) {
                    if (window.Hls) {
                        resolve(window.Hls);
                        return;
                    }

                    var existing = document.querySelector('script[data-hls-library]');

                    if (existing) {
                        existing.addEventListener('load', function () {
                            resolve(window.Hls);
                        });
                        existing.addEventListener('error', reject);
                        return;
                    }

                    var script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
                    script.defer = true;
                    script.setAttribute('data-hls-library', 'true');
                    script.onload = function () {
                        resolve(window.Hls);
                    };
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            function prepareVideo() {
                if (!video || !stream || prepared) {
                    return Promise.resolve();
                }

                prepared = true;

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                    return Promise.resolve();
                }

                return loadHlsLibrary().then(function (Hls) {
                    if (Hls && Hls.isSupported()) {
                        hlsInstance = new Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        hlsInstance.loadSource(stream);
                        hlsInstance.attachMedia(video);
                    } else {
                        video.src = stream;
                    }
                }).catch(function () {
                    video.src = stream;
                });
            }

            function playVideo() {
                prepareVideo().then(function () {
                    var attempt = video.play();

                    if (attempt && typeof attempt.then === 'function') {
                        attempt.then(function () {
                            player.classList.add('is-playing');
                        }).catch(function () {
                            player.classList.remove('is-playing');
                        });
                    } else {
                        player.classList.add('is-playing');
                    }
                });
            }

            if (button) {
                button.addEventListener('click', function (event) {
                    event.preventDefault();
                    playVideo();
                });
            }

            if (video) {
                video.addEventListener('play', function () {
                    player.classList.add('is-playing');
                });

                video.addEventListener('pause', function () {
                    if (video.currentTime === 0 || video.ended) {
                        player.classList.remove('is-playing');
                    }
                });
            }

            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }
}());
