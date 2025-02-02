const socket = io(); // Подключение к Socket.IO
const video = document.getElementById('video-player');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('video-file');

let isInitiator = false; // Указывает, кто инициировал событие

// 1. Слушаем локальные действия и отправляем их через WebSocket
video.addEventListener('play', () => {
    if (!isInitiator) {
        socket.emit('video_action', { action: 'play', currentTime: video.currentTime });
    }
    isInitiator = false;
});

video.addEventListener('pause', () => {
    if (!isInitiator) {
        socket.emit('video_action', { action: 'pause', currentTime: video.currentTime });
    }
    isInitiator = false;
});

video.addEventListener('seeked', () => {
    if (!isInitiator) {
        socket.emit('video_action', { action: 'seek', currentTime: video.currentTime });
    }
    isInitiator = false;
});

// 2. Получаем действия с сервера и выполняем их
socket.on('video_action', (data) => {
    isInitiator = true; // Чтобы не зациклить события

    if (data.action === 'play') {
        video.currentTime = data.currentTime; // Синхронизация времени
        video.play();
    } else if (data.action === 'pause') {
        video.pause();
    } else if (data.action === 'seek') {
        video.currentTime = data.currentTime;
    }
});

// 3. Отправка файла на сервер
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('video', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(filename => {
        socket.emit('new_video', { filename: filename }); // Сообщаем другим пользователям
        video.src = `/uploads/${filename}`;
    })
    .catch(err => console.error('Error uploading video:', err));
});

// 4. Слушаем события загрузки нового видео
socket.on('new_video', (data) => {
    video.src = `/uploads/${data.filename}`;
    video.load(); // Перезагружаем видео
});
