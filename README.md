Клонируйте репозиторий:

```bash
git clone https://github.com/ваш-репозиторий/smart-todo-pwa.git
cd smart-todo-pwa
```
Установите зависимости:

```bash
npm install
```
Сгенерируйте VAPID-ключи для push-уведомлений:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```
Замените ключи в server.js:

```javascript
const vapidKeys = {
  publicKey: 'ВАШ_PUBLIC_KEY',
  privateKey: 'ВАШ_PRIVATE_KEY'
};
```
Запустите сервер:

```bash
npm start
```
Откройте в браузере:

```
http://localhost:3000
```
