function initPlayer(source) {
    var video = document.getElementById('moviePlayer');
    var cover = document.querySelector('[data-player-cover]');
    var message = document.querySelector('[data-player-message]');
    var hls = null;

    function showMessage(text) {
        if (!message) {
            return;
        }
        message.textContent = text;
        message.hidden = !text;
    }

    function prepare() {
        if (!video || !source) {
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, function (eventName, data) {
                if (data && data.fatal) {
                    showMessage('播放暂时不可用，请稍后重试');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
        } else {
            showMessage('播放暂时不可用，请稍后重试');
        }
    }

    function play() {
        if (!video) {
            return;
        }
        if (cover) {
            cover.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
                if (cover) {
                    cover.classList.remove('is-hidden');
                }
            });
        }
    }

    prepare();

    if (cover) {
        cover.addEventListener('click', play);
    }

    if (video) {
        video.addEventListener('play', function () {
            if (cover) {
                cover.classList.add('is-hidden');
            }
        });
        video.addEventListener('pause', function () {
            if (cover && video.currentTime === 0) {
                cover.classList.remove('is-hidden');
            }
        });
    }

    window.addEventListener('beforeunload', function () {
        if (hls && typeof hls.destroy === 'function') {
            hls.destroy();
        }
    });
}
