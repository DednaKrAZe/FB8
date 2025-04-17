const express = require('express');
const path = require('path');
const webPush = require('web-push');
const app = express();

// Генерация VAPID keys (выполняется один раз)
//const vapidKeysnew = webPush.generateVAPIDKeys();
//console.log(vapidKeysnew);

const vapidKeys = {
  publicKey: 'BPjZF3zB8eVoavGGhKPFiBoJYJ0g_4xgUYm7iwK1bhVgkmvC7E1iAid9B60PqZ11N3ryNgLja3s5Vn5VrMCziX8',
  privateKey: 'WXTFKWzBt3zbQsIgSCPVQRORIdm8DkUtkAHxXr0DLSQ'
};

webPush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/icons', express.static(path.join(__dirname, 'public', 'icons')));

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/css/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'css', 'style.css'), {
    headers: {
      'Content-Type': 'text/css'
    }
  });
});


let subscriptions = [];


app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  console.log('New subscription added:', subscription);
  

  const payload = JSON.stringify({
    title: 'Подписка активирована!',
    body: 'Теперь вы будете получать уведомления о задачах.',
    icon: '/icons/icon-192x192.png'
  });
  
  webPush.sendNotification(subscription, payload)
    .catch(err => console.error('Error sending welcome notification:', err));
  
  res.status(201).json({});
});


app.get('/notify', (req, res) => {
  const payload = JSON.stringify({
    title: 'Напоминание о задачах',
    body: 'У вас есть невыполненные задачи!',
    icon: '/icons/icon-192x192.png'
  });
  
  subscriptions.forEach(subscription => {
    webPush.sendNotification(subscription, payload)
      .catch(err => console.error('Error sending notification:', err));
  });
  
  res.status(200).json({ message: 'Notifications sent' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});