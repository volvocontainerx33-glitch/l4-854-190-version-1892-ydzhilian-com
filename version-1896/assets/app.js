(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    var menuButton = qs('[data-menu-toggle]');
    var mobilePanel = qs('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    qsa('[data-search-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            var input = qs('input[name="q"]', form);
            if (input && !input.value.trim()) {
                event.preventDefault();
                window.location.href = './search.html';
            }
        });
    });

    var hero = qs('[data-hero]');

    if (hero) {
        var slides = qsa('[data-hero-slide]', hero);
        var dots = qsa('[data-hero-dot]', hero);
        var index = 0;
        var timer = null;

        function show(next) {
            if (!slides.length) {
                return;
            }
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                window.clearInterval(timer);
                show(i);
                start();
            });
        });

        start();
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function filterCards(options) {
        var list = qs('[data-card-list]') || document;
        var cards = qsa('[data-card]', list);
        var empty = qs('[data-empty-state]');
        var query = normalize(options.query);
        var year = normalize(options.year);
        var category = normalize(options.category);
        var visible = 0;

        cards.forEach(function (card) {
            var haystack = normalize(card.getAttribute('data-keywords'));
            var cardYear = normalize(card.getAttribute('data-year'));
            var cardCategory = normalize(card.getAttribute('data-category'));
            var matchQuery = !query || haystack.indexOf(query) !== -1;
            var matchYear = !year || cardYear === year;
            var matchCategory = !category || cardCategory === category;
            var matched = matchQuery && matchYear && matchCategory;
            card.hidden = !matched;
            if (matched) {
                visible += 1;
            }
        });

        if (empty) {
            empty.hidden = visible !== 0;
        }
    }

    var filterForm = qs('[data-filter-form]');
    var filterInput = qs('[data-filter-input]');

    if (filterForm && filterInput) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault();
        });
        filterInput.addEventListener('input', function () {
            filterCards({ query: filterInput.value });
        });
    }

    var searchPage = qs('[data-search-page]');

    if (searchPage) {
        var params = new URLSearchParams(window.location.search);
        var mainSearch = qs('[data-main-search]');
        var categorySelect = qs('[data-category-select]');
        var yearSelect = qs('[data-year-select]');

        if (mainSearch) {
            mainSearch.value = params.get('q') || '';
        }

        function runSearch() {
            filterCards({
                query: mainSearch ? mainSearch.value : '',
                category: categorySelect ? categorySelect.value : '',
                year: yearSelect ? yearSelect.value : ''
            });
        }

        [mainSearch, categorySelect, yearSelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', runSearch);
                control.addEventListener('change', runSearch);
            }
        });

        runSearch();
    }
})();
