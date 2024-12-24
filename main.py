from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
socketio = SocketIO(app, cors_allowed_origins="*")  # Разрешаем подключения из других сетей

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'video' not in request.files:
        return 'No file part', 400
    file = request.files['video']
    if file.filename == '':
        return 'No selected file', 400
    filename = file.filename
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return filename, 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 1. Слушаем действия с клиента и отправляем их другим пользователям
@socketio.on('video_action')
def handle_video_action(data):
    emit('video_action', data, broadcast=True, include_self=False)

# 2. Слушаем загрузку нового видео и уведомляем других
@socketio.on('new_video')
def handle_new_video(data):
    emit('new_video', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='192.168.56.1', port=5000)
