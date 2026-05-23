# 📚 Digital Library — Backend

REST API backend for the **Digital Library Management System** developed for **Kera Secondary School**.

Built using **NestJS**, **TypeScript**, and **MongoDB**, the backend provides secure authentication, digital book management, borrowing workflows, AI assistant integration, cloud file storage, and email notification services.

---

# 🌐 Live API

## Backend API URL
https://digital-library-backend-p5ga.onrender.com

---

# 🔗 Related Repository

## Frontend Repository
https://github.com/mumekonin/digital-library-frontend

## Frontend Application
https://digital-library-frontend-nine.vercel.app/

---

# 🔐 Demo Credentials

| Role | Email | Password |
|------|------|------|
| Admin | admin| 12345678 |
| Librarian | librarian | 12345678 |
| Student | student| 12345678 |

---

# 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| NestJS | Backend Framework |
| TypeScript | Type Safety |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| bcrypt | Password Hashing |
| Nodemailer | Email Notifications |
| Cloudinary | Cloud File Storage |
| Groq API | AI Assistant |
| Multer | File Upload Handling |
| Render | Deployment |

---

# ✨ Features

## Authentication & Security
- JWT Authentication
- Role-Based Access Control
- Password Hashing with bcrypt
- Protected API Routes
- DTO Validation

---

## Book Management
- Add Books
- Edit Books
- Delete Books
- Upload PDFs & Cover Images
- Availability Tracking

---

## Borrowing System
- Borrow Requests
- Return Processing
- Due Date Calculation
- Borrow History

---

## AI Research Assistant
- Natural Language Queries
- Intelligent Recommendations
- Academic Assistance
- Groq API Integration

---

## Email Notification System
- Password Reset Emails


---

---

# 🚀 Setup

```bash
git clone https://github.com/mumekonin/digital-library-backend.git
cd digital-library-backend
npm install
npm run start:dev
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
mongodb_uri=
jwt_secret=
cloudinary_cloud_name=
cloudinary_api_key=
cloudinary_api_secret=
groq_api_key=
smtp_user=
smtp_pass=
```

---

# ☁️ Deployment

Hosted on **Render** as a Web Service.

| Service | Platform |
|------|------|
| Backend Hosting | Render |
| Database | MongoDB Atlas |
| File Storage | Cloudinary CDN |

---

# 🔒 Security Features

| Security Layer | Implementation |
|------|------|
| Authentication | JWT |
| Authorization | Role Guards |
| Password Security | bcrypt |
| Validation | DTO Validation |
| File Security | Cloudinary Restrictions |
| HTTPS | Secure Media Delivery |

---

# 📌 Future Enhancements

- SMS Notifications
- AI Recommendation Engine
- Advanced Analytics
- Offline Support
- Multi-Library Support

---


# 🏫 Institution

Jimma University  
Jimma Institute of Technology  
Faculty of Computing and Informatics  
Department of Information Technology

---

# 👨‍🏫 Advisor

Mr. Ermias Tesfaye
