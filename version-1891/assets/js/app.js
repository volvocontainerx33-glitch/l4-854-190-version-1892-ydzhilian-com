(function () {
  var navButton = document.querySelector('[data-menu-toggle]');
  var navMenu = document.querySelector('[data-nav-menu]');

  if (navButton && navMenu) {
    navButton.addEventListener('click', function () {
      navMenu.classList.toggle('is-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var activeIndex = 0;

  function setHero(index) {
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

  if (slides.length) {
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        setHero(dotIndex);
      });
    });

    setInterval(function () {
      setHero(activeIndex + 1);
    }, 5200);
  }

  function startVideo(shell) {
    var video = shell.querySelector('video');

    if (!video) {
      return;
    }

    var source = video.getAttribute('data-src');

    if (!source) {
      return;
    }

    shell.classList.add('is-playing');

    if (window.Hls && window.Hls.isSupported()) {
      if (!video._hlsPlayer) {
        var player = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        player.loadSource(source);
        player.attachMedia(video);
        video._hlsPlayer = player;
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (!video.getAttribute('src')) {
        video.setAttribute('src', source);
      }
    } else if (!video.getAttribute('src')) {
      video.setAttribute('src', source);
    }

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        shell.classList.remove('is-playing');
      });
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (shell) {
    var button = shell.querySelector('[data-play-button]');
    var video = shell.querySelector('video');

    if (button) {
      button.addEventListener('click', function () {
        startVideo(shell);
      });
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startVideo(shell);
        } else {
          video.pause();
        }
      });

      video.addEventListener('pause', function () {
        if (!video.ended) {
          shell.classList.remove('is-playing');
        }
      });

      video.addEventListener('playing', function () {
        shell.classList.add('is-playing');
      });
    }
  });

  function createCard(movie) {
    var article = document.createElement('article');
    article.className = 'movie-card';

    article.innerHTML = [
      '<a class="poster-link" href="' + movie.url + '">',
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '">',
      '</a>',
      '<div class="card-body">',
      '<div class="card-meta">',
      '<span class="pill">' + escapeHtml(movie.year) + '</span>',
      '<span class="pill soft">' + escapeHtml(movie.region) + '</span>',
      '</div>',
      '<h3 class="card-title"><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p class="card-text">' + escapeHtml(movie.oneLine) + '</p>',
      '<div class="card-genre">' + escapeHtml(movie.genre) + '</div>',
      '</div>'
    ].join('');

    return article;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function runSearch() {
    var mount = document.querySelector('[data-search-results]');
    var input = document.querySelector('[data-search-input]');

    if (!mount || !input || !Array.isArray(window.SEARCH_DATA)) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';

    if (initial) {
      input.value = initial;
    }

    function render() {
      var query = input.value.trim().toLowerCase();
      var source = window.SEARCH_DATA;
      var results = query
        ? source.filter(function (movie) {
            return movie.searchText.indexOf(query) !== -1;
          })
        : source.slice(0, 48);

      mount.innerHTML = '';

      if (!results.length) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = '没有匹配到相关影片，可尝试更换片名、地区或题材。';
        mount.appendChild(empty);
        return;
      }

      results.slice(0, 120).forEach(function (movie) {
        mount.appendChild(createCard(movie));
      });
    }

    input.addEventListener('input', render);
    render();
  }

  runSearch();
})();
