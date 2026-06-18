(function () {
    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initMobileMenu() {
        var button = document.querySelector('[data-mobile-menu-button]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
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
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                stop();
                show(index);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        var bars = Array.prototype.slice.call(document.querySelectorAll('.js-filter-bar'));
        bars.forEach(function (bar) {
            var section = bar.closest('.section') || document;
            var list = section.querySelector('[data-filter-list]');
            if (!list) {
                list = document.querySelector('[data-filter-list]');
            }
            if (!list) {
                return;
            }
            var items = Array.prototype.slice.call(list.querySelectorAll('.js-filter-item'));
            var search = bar.querySelector('[data-filter-search]');
            var selects = Array.prototype.slice.call(bar.querySelectorAll('[data-filter-field]'));
            var reset = bar.querySelector('[data-filter-reset]');
            var count = section.querySelector('[data-filter-count]');

            function apply() {
                var keyword = normalize(search ? search.value : '');
                var visible = 0;
                items.forEach(function (item) {
                    var haystack = normalize([
                        item.dataset.title,
                        item.dataset.type,
                        item.dataset.year,
                        item.dataset.region,
                        item.dataset.genre,
                        item.dataset.tags,
                        item.dataset.siteCategory
                    ].join(' '));
                    var ok = !keyword || haystack.indexOf(keyword) !== -1;
                    selects.forEach(function (select) {
                        var value = normalize(select.value);
                        var field = select.getAttribute('data-filter-field');
                        if (value && normalize(item.dataset[field]) !== value) {
                            ok = false;
                        }
                    });
                    item.classList.toggle('is-hidden', !ok);
                    if (ok) {
                        visible += 1;
                    }
                });
                if (count) {
                    count.textContent = '当前显示 ' + visible + ' / ' + items.length + ' 部影片';
                }
            }

            if (search) {
                search.addEventListener('input', apply);
            }
            selects.forEach(function (select) {
                select.addEventListener('change', apply);
            });
            if (reset) {
                reset.addEventListener('click', function () {
                    if (search) {
                        search.value = '';
                    }
                    selects.forEach(function (select) {
                        select.value = '';
                    });
                    apply();
                });
            }
            apply();
        });
    }

    function movieCard(movie) {
        var tags = (movie.tags || []).join('、');
        return [
            '<article class="movie-card">',
            '  <a href="' + movie.url + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
            '    <div class="movie-cover" data-title="' + escapeHtml(movie.title) + '">',
            '      <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.style.display=\'none\'; this.parentElement.classList.add(\'cover-fallback\');">',
            '      <span class="movie-duration">' + escapeHtml(movie.duration) + '</span>',
            '    </div>',
            '    <div class="movie-card-body">',
            '      <span class="movie-badge">' + escapeHtml(movie.site_category) + '</span>',
            '      <h3>' + escapeHtml(movie.title) + '</h3>',
            '      <p>' + escapeHtml(movie.one_line) + '</p>',
            '      <div class="movie-meta-line">',
            '        <span>' + escapeHtml(movie.year) + '</span>',
            '        <span>' + escapeHtml(movie.type) + '</span>',
            '        <span>' + escapeHtml(tags) + '</span>',
            '      </div>',
            '    </div>',
            '  </a>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initSearchPage() {
        var results = document.querySelector('[data-search-results]');
        var input = document.querySelector('[data-search-input]');
        var summary = document.querySelector('[data-search-summary]');
        if (!results || !window.MOVIE_DATA) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var keyword = params.get('q') || '';
        if (input) {
            input.value = keyword;
        }
        function render(query) {
            var q = normalize(query);
            if (!q) {
                results.innerHTML = '';
                if (summary) {
                    summary.textContent = '请输入关键词开始搜索。';
                }
                return;
            }
            var matched = window.MOVIE_DATA.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.one_line,
                    movie.site_category,
                    movie.genre,
                    movie.region,
                    movie.type,
                    movie.year,
                    (movie.tags || []).join(' ')
                ].join(' '));
                return haystack.indexOf(q) !== -1;
            }).slice(0, 240);
            results.innerHTML = matched.map(movieCard).join('');
            if (summary) {
                summary.textContent = '关键词“' + query + '”共找到 ' + matched.length + ' 个结果' + (matched.length >= 240 ? '，已显示前 240 个。' : '。');
            }
        }
        render(keyword);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initHero();
        initFilters();
        initSearchPage();
    });
}());
