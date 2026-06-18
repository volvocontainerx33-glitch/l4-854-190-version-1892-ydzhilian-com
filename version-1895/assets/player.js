import { H as Hls } from './hls-vendor-dru42stk.js';

function setupPlayer(player) {
    const video = player.querySelector('video');
    const startButton = player.querySelector('[data-player-start]');
    const state = player.querySelector('[data-player-state]');
    const source = player.getAttribute('data-src');
    let initialized = false;
    let hls = null;

    if (!video || !source) {
        return;
    }

    function setState(message) {
        if (state) {
            state.textContent = message;
        }
    }

    function initialize() {
        if (initialized) {
            return;
        }
        initialized = true;
        setState('正在加载 HLS 播放源...');

        if (Hls && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                setState('播放源加载完成');
            });
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    setState('视频加载失败，请刷新页面重试');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.addEventListener('loadedmetadata', function () {
                setState('播放源加载完成');
            }, { once: true });
        } else {
            setState('当前浏览器不支持 HLS 播放');
        }
    }

    async function playVideo() {
        initialize();
        player.classList.add('is-started');
        try {
            await video.play();
        } catch (error) {
            player.classList.remove('is-started');
            setState('浏览器阻止自动播放，请再次点击播放');
        }
    }

    if (startButton) {
        startButton.addEventListener('click', playVideo);
    }
    player.addEventListener('click', function (event) {
        if (event.target === video) {
            return;
        }
        if (!player.classList.contains('is-started')) {
            playVideo();
        }
    });
    video.addEventListener('play', function () {
        player.classList.add('is-started');
    });
    video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
            player.classList.remove('is-started');
        }
    });
    window.addEventListener('beforeunload', function () {
        if (hls) {
            hls.destroy();
        }
    });
}

document.querySelectorAll('.js-video-player').forEach(setupPlayer);
