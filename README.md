# 🎓 Cost Sharing Management System

A modern web-based Cost Sharing Management System developed to simplify the management of university student cost-sharing records. The system enables universities to securely upload student information, while administrators can review, approve, manage, and generate reports through an intuitive dashboard.

## 🚀 Features

### Authentication & Security
- Secure JWT-based authentication
- Role-based access control (Admin & University)
- Forgot password and password reset via email
- Password encryption using bcrypt
- Protected routes

### University Module
- Upload student records using Excel/CSV files
- View uploaded records
- Search and filter students
- Track upload history

### Admin Module
- Manage universities
- Manage users and roles
- Review uploaded student records
- Approve or reject student submissions
- Export reports to CSV

### Dashboard & Reports
- Interactive analytics dashboard
- Student statistics
- University performance
- Monthly payment reports
- Paid vs Unpaid analysis
- Interest trend visualization
- Pending approval monitoring

### Student Management
- Student registration records
- Payment status tracking
- Outstanding balance calculation
- Search, filter, and pagination

## 🛠️ Technologies Used

### Frontend
- React.js
- Material UI (MUI)
- Axios
- React Router
- Recharts

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- bcrypt
- Multer

### Development Tools
- Git & GitHub
- Postman
- Visual Studio Code

## 📂 Project Structure

```
cost-sharing-system/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── uploads/
│   └── package.json
│
└── README.md
```

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/cost-sharing-system.git
```

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Environment Variables

Create a `.env` file inside the server folder.

```env
PORT=5000

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=costsharing
DB_PORT=5432

JWT_SECRET=your_secret_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

## API Endpoints

### Authentication

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Universities

```
GET    /api/universities
POST   /api/universities
PUT    /api/universities/:id
DELETE /api/universities/:id
```

### Students

```
GET    /api/students
POST   /api/students/upload
PATCH  /api/students/:id/approval
```

### Reports

```
GET /api/reports/dashboard
GET /api/reports/dashboard-students
GET /api/reports/universities-status
GET /api/reports/interest
GET /api/reports/university/:id/export
```

## 📊 System Modules

- User Authentication
- User Management
- University Management
- Student Upload
- Approval Workflow
- Dashboard
- Reports & Analytics
- CSV Export
- Password Recovery

## 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected API Routes
- Role-Based Authorization
- Input Validation
- Secure Password Reset

## 📈 Future Improvements

- PDF Report Export
- Email Notifications
- SMS Notifications
- Audit Logs
- Mobile Application
- Multi-language Support
- Two-Factor Authentication (2FA)

## 👨‍💻 Author

**Guash Berhe Tela**

- Software Engineer
- Ministry of Revenue, Ethiopia

GitHub: https://github.com/mercy143

LinkedIn: https://www.linkedin.com/in/guashberhe2026

Email: guashberhe2019@gmail.com

## 📄 License

This project is developed for educational and organizational purposes.