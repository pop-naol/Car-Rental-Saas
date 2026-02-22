# Car Rental Management - Frontend

Modern, responsive frontend application for the Enterprise Car Rental Management SaaS platform built with Next.js 14, React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Features
- **Authentication**: Secure login with JWT tokens
- **Dashboard**: Real-time metrics and analytics
- **Vehicle Management**: Complete fleet management interface
- **Booking System**: Create and manage bookings
- **Rental Management**: Start/end rentals with calculations
- **Customer Management**: Customer profiles and history
- **Driver Management**: Driver tracking and performance
- **Financial Reports**: Revenue and expense tracking
- **Maintenance Logs**: Vehicle maintenance tracking
- **Analytics**: Charts and business intelligence
- **Notifications**: Real-time alerts and updates
- **Document Management**: File upload and organization

### UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Sidebar**: Professional navigation
- **Real-time Updates**: Live data refresh
- **Toast Notifications**: User feedback
- **Loading States**: Smooth user experience
- **Form Validation**: Client-side validation
- **Search & Filters**: Easy data discovery
- **Charts & Graphs**: Visual analytics

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Date Handling**: date-fns

## 📁 Project Structure

```
packages/frontend/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx             # Dashboard home
│   │   ├── vehicles/            # Vehicle management
│   │   ├── bookings/            # Booking management
│   │   ├── rentals/             # Rental management
│   │   ├── customers/           # Customer management
│   │   ├── drivers/             # Driver management
│   │   ├── financial/           # Financial reports
│   │   ├── maintenance/         # Maintenance logs
│   │   ├── analytics/           # Analytics dashboard
│   │   ├── branches/            # Branch management
│   │   ├── employees/           # Employee management
│   │   ├── documents/           # Document management
│   │   └── notifications/       # Notifications
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (redirects)
│   └── globals.css              # Global styles
├── components/
│   └── Sidebar.tsx              # Navigation sidebar
├── lib/
│   ├── api.ts                   # API client
│   └── utils.ts                 # Utility functions
├── store/
│   └── auth.ts                  # Authentication store
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:5000

### Installation

1. Navigate to frontend directory
```bash
cd packages/frontend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

4. Start development server
```bash
npm run dev
```

5. Open browser
```
http://localhost:3000
```

### Demo Credentials
```
Email: admin@carrental.com
Password: Admin123!@#
```

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server on port 3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🎨 UI Components

### Layout Components
- **Sidebar**: Navigation with role-based menu items
- **Dashboard Layout**: Protected layout with authentication check
- **Root Layout**: Global layout with toast notifications

### Page Components
- **Login Page**: Authentication form
- **Dashboard**: Metrics and charts
- **Vehicle List**: Grid view with filters
- **Booking List**: Table view with actions
- **Forms**: Create/edit modals (to be implemented)

### Utility Components
- **Loading Spinner**: Consistent loading states
- **Toast Notifications**: User feedback
- **Status Badges**: Color-coded status indicators
- **Charts**: Line and bar charts for analytics

## 🔐 Authentication Flow

1. User enters credentials on login page
2. API client sends request to `/api/auth/login`
3. On success, tokens stored in localStorage
4. User object stored in Zustand store
5. Protected routes check authentication
6. Automatic token refresh on 401 errors
7. Logout clears all stored data

## 📊 State Management

### Zustand Stores

**Auth Store** (`store/auth.ts`)
- User information
- Authentication status
- Login/logout functions
- Token management

### Future Stores
- Vehicles store
- Bookings store
- Notifications store
- UI preferences store

## 🎯 API Integration

### API Client (`lib/api.ts`)

Features:
- Automatic token injection
- Token refresh on expiry
- Error handling
- Type-safe methods

Usage:
```typescript
import { api } from '@/lib/api'

// GET request
const data = await api.get<ResponseType>('/endpoint')

// POST request
const result = await api.post('/endpoint', { data })

// PATCH request
const updated = await api.patch('/endpoint', { data })

// DELETE request
await api.delete('/endpoint')
```

## 🎨 Styling Guide

### Tailwind CSS Classes

**Buttons**
```tsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Danger</button>
```

**Inputs**
```tsx
<input className="input" />
```

**Cards**
```tsx
<div className="card">Content</div>
```

**Badges**
```tsx
<span className="badge bg-green-100 text-green-800">Active</span>
```

### Color Palette
- **Primary**: Blue (#0ea5e9)
- **Success**: Green
- **Warning**: Yellow
- **Danger**: Red
- **Gray**: Neutral tones

## 📱 Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach
All components are designed mobile-first and scale up for larger screens.

## 🔄 Data Flow

1. **Component Mount**: Load data from API
2. **User Action**: Trigger API call
3. **Loading State**: Show spinner
4. **Success**: Update UI and show toast
5. **Error**: Show error toast
6. **Refresh**: Reload data

## 🚧 Future Enhancements

### Short-term
- [ ] Complete all CRUD forms
- [ ] Advanced filters and search
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Print views

### Medium-term
- [ ] Real-time updates (WebSocket)
- [ ] Offline support (PWA)
- [ ] Advanced charts
- [ ] Custom reports
- [ ] User preferences

### Long-term
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Theme customization
- [ ] Advanced analytics
- [ ] AI-powered insights

## 🐛 Troubleshooting

### Common Issues

**API Connection Error**
- Check backend is running on port 5000
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check CORS settings in backend

**Authentication Issues**
- Clear localStorage
- Check token expiry
- Verify credentials

**Build Errors**
- Delete .next folder
- Clear node_modules and reinstall
- Check TypeScript errors

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Maintain responsive design
4. Add proper error handling
5. Write clean, readable code

## 📝 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**
