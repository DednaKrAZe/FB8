document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const enableNotificationsBtn = document.getElementById('enable-notifications');
    
    let currentFilter = 'all';
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    function init() {
      renderTasks();
      registerServiceWorker();
      checkNotificationSupport();
      
      setInterval(checkUncompletedTasks, 2 * 60 * 60 * 1000);
    }
    
    function registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/js/sw.js')
          .then(registration => {
            console.log('ServiceWorker registered');
          })
          .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
          });
      }
    }
    
    function checkNotificationSupport() {
      if (!('Notification' in window) || !('PushManager' in window)) {
        enableNotificationsBtn.style.display = 'none';
      } else {
        enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
      }
    }
    
    function requestNotificationPermission() {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
          subscribeToPushNotifications();
          enableNotificationsBtn.textContent = 'Уведомления включены';
          enableNotificationsBtn.disabled = true;
        }
      });
    }
    
    function subscribeToPushNotifications() {
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
        });
      })
      .then(subscription => {
        console.log('Push subscription:', subscription);
        fetch('/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
      })
      .catch(err => {
        console.error('Push subscription error:', err);
      });
    }
    
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    function checkUncompletedTasks() {
      const uncompletedTasks = tasks.filter(task => !task.completed);
      if (uncompletedTasks.length > 0) {
        console.log('У вас есть невыполненные задачи!');
      }
    }
    
    function addTask() {
      const text = todoInput.value.trim();
      if (text) {
        const newTask = {
          id: Date.now(),
          text,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        todoInput.value = '';
        
        if (Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Новая задача добавлена', {
              body: text,
              icon: '/icons/icon-192x192.png'
            });
          });
        }
      }
    }
    
    function saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
      todoList.innerHTML = '';
      
      const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
      });
      
      if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Нет задач';
        emptyMessage.classList.add('empty-message');
        todoList.appendChild(emptyMessage);
        return;
      }
      
      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', toggleTask);
        
        const span = document.createElement('span');
        span.textContent = task.text;
        if (task.completed) {
          span.classList.add('completed');
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', deleteTask);
        
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        
        todoList.appendChild(li);
      });
    }
    
    function toggleTask(e) {
      const taskId = parseInt(e.target.parentElement.dataset.id);
      tasks = tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: !task.completed };
        }
        return task;
      });
      saveTasks();
      renderTasks();
    }
    
    function deleteTask(e) {
      const taskId = parseInt(e.target.parentElement.dataset.id);
      tasks = tasks.filter(task => task.id !== taskId);
      saveTasks();
      renderTasks();
    }
    
    function setFilter(e) {
      currentFilter = e.target.dataset.filter;
      filterBtns.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      renderTasks();
    }
    
    addBtn.addEventListener('click', addTask);
    todoInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') addTask();
    });
    filterBtns.forEach(btn => {
      btn.addEventListener('click', setFilter);
    });
    
    // Запуск приложения
    init();
  });