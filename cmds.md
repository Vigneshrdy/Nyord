# 🧰 Commands Cheat Sheet (`commands.md`)

A clean reference guide for development and server operations.

---

## 🚀 **Local Development (Windows)**

### **Frontend**

```sh
npm run dev
```

### **Backend**

```sh
uvicorn app.main:app --reload
```

### **Celery Worker**

```sh
celery -A app.tasks worker --loglevel=info --pool=solo
```

---

## 🌐 **Server Commands**

### **1. SSH Into Server**

```sh

```

---

## 🐍 **Backend (Server)**

### **Activate Virtual Environment**

```sh
source Nyord/backend/venv/bin/activate
```

---

## 🖥️ **Using Screen Sessions**

### **Frontend Build & Preview**

```sh
screen -r one
npm run build
npm run preview
```

### **Backend Uvicorn**

```sh
screen -r two
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **Celery Worker**

```sh
screen -r celery
celery -A app.tasks worker --loglevel=info
```

---

## 🗄️ **PostgreSQL Access**

```sh
sudo -i -u postgres
psql
```

---

## 🔪 **Kill Ports (Useful for Conflicts)**

### **Kill Vite (5173)**

```sh
sudo kill -9 $(sudo lsof -t -i:5173)
```

### **Kill Uvicorn (8000)**

```sh
sudo kill -9 $(sudo lsof -t -i:8000)
```

---

## 📄 **View Nginx Config**

```sh
cat /etc/nginx/sites-enabled/taksari.me
```

---

