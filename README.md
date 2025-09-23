# 🌟 Sky S - Modern E-commerce Platform

  <img src="project-cover.png" alt="Sky S - Modern E-commerce Platform" width="800" />



[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)

A modern, scalable e-commerce platform built with cutting-edge technologies and following industry best practices. Sky S combines a robust NestJS backend with a sleek Next.js frontend to deliver an exceptional shopping experience.

## ✨ Features

- 🛒 **Complete E-commerce Solution** - Product catalog, shopping cart, order management
- 🔐 **Secure Authentication** - JWT-based authentication with role-based access control
- 💳 **Payment Integration** - Secure payment processing
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🎨 **Modern UI** - Beautiful components with shadcn/ui
- 🚀 **High Performance** - Optimized for speed and scalability
- 🔍 **Advanced Search** - Smart product search and filtering
- 📊 **Admin Dashboard** - Comprehensive admin panel for store management

## 🏗️ Architecture

Sky S follows a microservices-inspired architecture with clear separation of concerns:

### Backend (NestJS)
- **SOLID Principles** - Clean, maintainable, and testable code
- **Modular Design** - Feature-based modules for scalability
- **Type Safety** - Full TypeScript implementation
- **API Documentation** - Auto-generated Swagger documentation
- **Database** - PostgreSQL with Prisma ORM
- **Authentication** - JWT tokens with refresh token rotation
- **Validation** - Input validation and sanitization
- **Error Handling** - Centralized error handling and logging

### Frontend (Next.js)
- **Server-Side Rendering** - SEO-optimized pages
- **State Management** - Zustand for efficient state handling
- **Component Library** - shadcn/ui for consistent design
- **Styling** - Tailwind CSS for utility-first styling
- **Type Safety** - Full TypeScript integration
- **Performance** - Code splitting and optimization

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Containerization**: Docker
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios/Fetch

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL
- **Code Quality**: ESLint, Prettier
- **Package Manager**: npm/yarn
- **Version Control**: Git

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/redaezziani/sky-s.git
   cd sky-s
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables
   cp .env.example .env
   
   # Start database with Docker
   docker-compose up -d postgres
   
   # Run Prisma migrations
   npx prisma migrate dev
   npx prisma generate
   
   # Seed the database (optional)
   npx prisma db seed
   
   # Start the backend server
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Copy environment variables
   cp .env.example .env.local
   
   # Start the frontend server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://192.168.1.1:3000
   - Backend API: http://192.168.1.1:3001
   - API Documentation: http://192.168.1.1:3001/api

## 🐳 Docker Deployment

Run the entire application with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## 📁 Project Structure

```
sky-s/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── products/       # Product catalog
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Payment processing
│   │   └── common/         # Shared utilities
│   ├── prisma/             # Database schema & migrations
│   └── docker/             # Docker configurations
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities & configurations
│   │   ├── hooks/        # Custom React hooks
│   │   └── store/        # Zustand stores
└── docker-compose.yml     # Docker services
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@192.168.1.1:5432/skystore"
JWT_SECRET="your-super-secure-jwt-secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://192.168.1.1:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📊 API Documentation

The API documentation is automatically generated using Swagger and available at:
- Development: http://192.168.1.1:3001/api
- Production: https://your-domain.com/api

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework

## 📞 Support

For support, email support@sky-s.com or join our Slack channel.

---

<p align="center">
  Made with ❤️ by the Sky S Team
</p>