# Biotechnology Department Portal
### Federal University Lokoja — Faculty of Life Sciences

A complete, production-ready departmental portal for departmental dues payment, receipt management, lecturer material distribution, and administrative oversight.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 · Tailwind CSS · TypeScript |
| Backend | Node.js · Express.js · TypeScript |
| Database | MySQL 8.x |
| Auth | JWT · bcryptjs |
| Payments | Paystack |
| File Storage | Cloudinary |
| PDF | PDFKit |
| Email | Nodemailer |

---

## Project Structure

```
biotech-portal/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, error handling
│   │   ├── routes/       # Express routers
│   │   └── services/     # PDF, email, Cloudinary
│   └── package.json
├── frontend/         # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/    # Admin pages
│   │   │   ├── lecturer/ # Lecturer pages
│   │   │   ├── payment/  # Payment flow
│   │   │   ├── materials/# Student materials
│   │   │   └── receipt/  # Receipt recovery
│   │   └── lib/          # API client, Zustand store
│   └── package.json
└── database/
    └── schema.sql    # Full MySQL schema
```

---

## Prerequisites

- Node.js 18+
- MySQL 8.x
- Cloudinary account
- Paystack account (test/live keys)
- SMTP email credentials

---

## Database Setup

```sql
-- Create database
CREATE DATABASE biotech_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Import schema
mysql -u root -p biotech_portal < database/schema.sql
```

Default admin credentials (from schema):
- **Email:** admin@biotech.ful.edu.ng
- **Password:** Admin@2024

> **Change the default password immediately after first login.**

---

## Backend Setup

```bash
cd backend
npm install

# Copy and fill environment variables
cp .env.example .env
```

### Backend `.env` Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=biotech_portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Biotech Portal <noreply@biotech.ful.edu.ng>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

```bash
# Build and run
npm run build
npm start

# Development
npm run dev
```

---

## Frontend Setup

```bash
cd frontend
npm install

cp .env.local.example .env.local
```

### Frontend `.env.local` Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

```bash
npm run dev     # Development
npm run build   # Production build
npm start       # Start production server
```

---

## User Roles

### Students (No Login Required)
- Browse and download course materials
- Pay departmental dues via Paystack
- Retrieve receipts by matric number / receipt number / reference

### Lecturers
- Register (requires admin approval before login)
- Upload PDF course materials (max 50MB)
- Edit, replace, and delete their materials

### Administrator
- Full platform management via dashboard
- Approve/reject/suspend lecturer accounts
- View revenue analytics (daily/weekly/monthly/annual)
- Manage payments and export CSV
- Search and reissue receipts
- Create academic sessions and courses
- Customize branding, department info, and payment amounts

---

## Payment Flow

1. Student fills payment form (name, matric, email, level, session)
2. Portal shows fee breakdown (Dues ₦2000 + Processing ₦100 = ₦2100)
3. Paystack inline popup handles card/bank payment
4. After payment, portal **verifies** with Paystack API before marking successful
5. Receipt PDF generated with unique receipt number (format: `BTH-YYYY-XXXXX`)
6. Student can download or email receipt

---

## API Endpoints Summary

### Public
```
GET  /api/public/stats
GET  /api/public/settings
GET  /api/public/academic
GET  /api/public/announcements
GET  /api/public/latest-materials
```

### Auth
```
POST /api/auth/admin/login
POST /api/auth/lecturer/login
POST /api/auth/lecturer/register
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/profile
```

### Materials
```
GET  /api/materials/public
POST /api/materials/download/:id
POST /api/materials/upload       (lecturer)
GET  /api/materials/my           (lecturer)
PUT  /api/materials/:id          (lecturer)
DELETE /api/materials/:id        (lecturer)
DELETE /api/materials/admin/:id  (admin)
```

### Payment
```
POST /api/payment/initiate
GET  /api/payment/verify?reference=xxx
POST /api/payment/receipt/find
GET  /api/payment/receipt/download/:receipt_number
POST /api/payment/webhook
```

### Admin (all require admin JWT)
```
GET   /api/admin/dashboard
GET   /api/admin/lecturers
PATCH /api/admin/lecturers/:id/status
PATCH /api/admin/lecturers/:id/reset-password
DELETE /api/admin/lecturers/:id
GET   /api/admin/payments
GET   /api/admin/settings
PUT   /api/admin/settings
POST  /api/admin/settings/branding/:type
GET   /api/admin/academic
POST  /api/admin/academic/sessions
POST  /api/admin/academic/courses
GET   /api/admin/announcements
POST  /api/admin/announcements
DELETE /api/admin/announcements/:id
```

---

## Deployment

### Railway

1. Push backend and frontend to separate GitHub repos (or monorepo with separate services)
2. Create Railway project → Add Service → GitHub repo
3. Set environment variables in Railway dashboard
4. Add MySQL plugin (Railway provides managed MySQL)
5. Set `PORT` to Railway's `$PORT` variable

### Hostinger / VPS

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Backend
cd backend && npm install && npm run build
pm2 start dist/server.js --name biotech-backend

# Frontend (build and serve)
cd frontend && npm install && npm run build
pm2 start npm --name biotech-frontend -- start

# Save PM2 config
pm2 save && pm2 startup
```

### Nginx Config (VPS)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Security Features

- Passwords hashed with bcryptjs (salt rounds: 12)
- JWT authentication with configurable expiry
- Role-based access control (Admin / Lecturer / Public)
- Rate limiting: 100 req/15min globally; 10 payment initiations/hour
- Helmet.js security headers
- CORS configured for frontend origin only
- SQL injection protection via parameterized queries
- File upload validation (PDF only, 50MB limit)
- Payment verification — never trusted until confirmed with Paystack API
- Paystack webhook signature verification

---

## Default Settings (configurable in Admin → Settings)

| Setting | Default |
|---------|---------|
| Departmental Dues | ₦2,000 |
| Receipt Processing Fee | ₦100 |
| Department Name | Biotechnology |
| Faculty Name | Faculty of Life Sciences |
| University | Federal University Lokoja |

---

## Support

For issues or feature requests, contact the development team.

> Built for the Department of Biotechnology, Faculty of Life Sciences, Federal University Lokoja.
