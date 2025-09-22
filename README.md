# MediaHub - Multi-Platform Media Downloader

![MediaHub Logo](https://img.shields.io/badge/MediaHub-Media%20Downloader-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)

A full-stack web application that enables users to download media content from popular social platforms while supporting charitable causes through an ad-supported freemium model.

## 🚀 Features

### Platform Support
- 🔧 **YouTube** - UI implemented, backend integration in development
- 🔧 **Instagram** - UI implemented, backend integration in development
- 🔧 **Twitter/X** - UI implemented, backend integration in development
- 🔧 **TikTok** - UI implemented, backend integration in development
- 🚧 **Coming Soon**: Facebook, LinkedIn, Snapchat, Reddit, Twitch (shows "coming soon" message)

### Download Options
- **Free Quality**: 480p video, 128kbps audio (15-second ad modal - Google Ads integration pending)
- **Premium Quality**: 720p/1080p video, 320kbps audio (30-second ad modal - Google Ads integration pending)
- Both tiers support charitable donations through Stripe integration

### Key Features
- 🎯 **Multi-URL Support**: UI for up to 3 media URLs (backend processing in development)
- 🌍 **Charitable Impact**: Donation system integrated with Stripe
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Progress Tracking**: UI for download progress (real-time updates pending backend)
- 💳 **Secure Payments**: Stripe-powered donation system (requires API keys)
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **shadcn/ui** for consistent UI components
- **Tailwind CSS** for styling
- **Stripe.js** for payment processing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **In-memory storage** (production-ready PostgreSQL with Drizzle ORM available)
- **Zod** for runtime validation
- **Stripe API** for payment processing
- **Mock download processing** (actual media downloaders in development)

## 📋 Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** or **yarn** package manager
- **Stripe Account** (for donations)
- **Git** for version control

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mediahub.git
cd mediahub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create environment files for Stripe integration:

**Client Environment (.env.local):**
```bash
# Frontend Stripe key (safe to expose)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
```

**Server Environment (.env):**
```bash
# Backend Stripe key (keep secret)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Important Notes:**
- Get your keys from https://dashboard.stripe.com/apikeys
- Use test keys (starting with `pk_test_` and `sk_test_`) for development
- Add `.env` and `.env.local` to your `.gitignore` file
- **Donations will be disabled if keys are missing** (graceful fallback)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend & Backend**: http://localhost:5000
- **API Endpoints**: http://localhost:5000/api/*

### 5. Build for Production

```bash
npm run build
npm start
```

## 🌐 Free Hosting Options

### Option 1: Render (Recommended for Full-Stack)
**Best for**: Production-ready applications with reliable uptime

1. **Sign up**: Create account at [render.com](https://render.com)
2. **Connect Repository**: Link your GitHub/GitLab repo
3. **Configure Build**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Add Environment Variables**: Set your Stripe keys in Render dashboard
5. **Deploy**: Automatic deployments on git push

**Free Tier**: 750 hours/month, sleeps after 15 mins inactivity
**Upgrade Path**: $7-19/month for always-on services

### Option 2: Railway (Best Developer Experience)
**Best for**: Quick deployments and prototyping

1. **Sign up**: Create account at [railway.app](https://railway.app)
2. **Deploy**: Use Railway CLI or connect GitHub
```bash
npx @railway/cli login
npx @railway/cli deploy
```
3. **Configure Environment**: Add Stripe keys via Railway dashboard
4. **Custom Domain**: Available on paid plans

**Free Tier**: $5 one-time credit (30-day trial)
**Upgrade Path**: $5/month minimum usage

### Option 3: Vercel (Frontend) + Backend Elsewhere
**Best for**: Next.js or static sites with serverless functions

1. **Frontend on Vercel**:
   - Deploy React build to [vercel.com](https://vercel.com)
   - Configure environment variables
2. **Backend Separately**:
   - Deploy Express server to Render/Railway
   - Update API endpoints in frontend

### Option 4: Netlify (Static) + Serverless Functions
**Best for**: JAMstack applications

- Deploy static build to [netlify.com](https://netlify.com)
- Use Netlify Functions for API endpoints
- Limited backend capabilities

### Option 5: Docker (Self-Hosted)
**Best for**: Custom deployments and container orchestration

1. **Clone & Configure**:
```bash
git clone <your-repo-url>
cd mediahub
cp .env.example .env
# Edit .env with your Stripe keys (both STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY)
```

2. **Deploy with Docker Compose**:
```bash
docker-compose up --build -d
```

3. **Or build manually**:
```bash
# Build with environment variables
docker build -t mediahub \
  --build-arg VITE_STRIPE_PUBLIC_KEY=pk_test_your_key \
  --build-arg VITE_API_BASE_URL= \
  .

# Run with environment variables
docker run -d -p 5000:5000 \
  -e STRIPE_SECRET_KEY=sk_test_your_key \
  -e NODE_ENV=production \
  mediahub
```

**Benefits**: Full control, scalable, production-ready containerization
**Requirements**: Server with Docker, proper environment configuration

## 📁 Project Structure

```
mediahub/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── google-ad.tsx        # Ad display component
│   │   │   ├── download-interface.tsx # Main download UI
│   │   │   └── header.tsx           # Navigation header
│   │   ├── pages/           # Route components
│   │   │   ├── home.tsx     # Landing page
│   │   │   ├── donate.tsx   # Donation page
│   │   │   └── not-found.tsx # 404 page
│   │   ├── lib/             # Utilities
│   │   │   ├── url-validator.ts # Platform URL validation
│   │   │   └── queryClient.ts   # API client setup
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript definitions
│   └── index.html           # Entry point
├── server/                  # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route handlers
│   ├── storage.ts          # Data storage interface
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schemas with Zod
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS setup
└── README.md              # This file
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Optional: Database (PostgreSQL)
npm run db:push     # Push schema changes to database (not required for default setup)

# Code Quality
npm run check       # TypeScript type checking
```

## 🎯 Usage Guide

### Testing the Download Interface

1. **Enter URLs**: Paste media URLs from supported platforms (validation works)
2. **Choose Quality**: 
   - Free: Shows 15-second ad modal simulation
   - Premium: Shows 30-second ad modal simulation + charity tracking
3. **Watch Ad**: Complete the ad modal (Google Ads integration pending)
4. **Mock Download**: Demo download process with progress simulation

**Current Status**: Full UI/UX implemented, backend media processing in development

### Making Donations

1. Navigate to `/donate` or click "Donate" in header
2. Choose donation amount (quick select or custom)
3. Enter payment details through secure Stripe checkout
4. Confirmation and receipt via email

### Platform Support

- **YouTube**: `https://youtube.com/watch?v=...` or `https://youtu.be/...`
- **Instagram**: `https://instagram.com/p/...` or `https://instagram.com/reel/...`
- **Twitter**: `https://twitter.com/user/status/...` or `https://x.com/user/status/...`
- **TikTok**: `https://tiktok.com/@user/video/...` or `https://vm.tiktok.com/...`

## 🐛 Troubleshooting

### Common Issues

**Donation page not working**:
- Verify Stripe environment variables are set
- Check browser console for errors
- Ensure using test keys for development

**Download simulation not working**:
- Check browser console for errors
- Verify URL format matches supported platform patterns
- Note: Actual media downloading is not yet implemented (UI demo only)

**Build errors**:
- Clear node_modules and reinstall dependencies
- Check Node.js version (20+ required)
- Verify all environment variables are set

### Development Tips

- Use browser DevTools Network tab to debug API calls
- Check terminal for server-side error logs
- Stripe test cards: `4242 4242 4242 4242` (any future date, any CVC)

## 🔒 Security Considerations

### Production Deployment

- **HTTPS required** for all production deployments
- **Environment variables**: Set securely, never commit to git
- **Split deployments**: If frontend/backend deployed separately:
  ```bash
  # Frontend environment
  VITE_API_BASE_URL=https://your-backend-api.com
  ```
  - Configure CORS on backend to allow frontend domain
  - Ensure API endpoints are accessible from frontend domain
- **Stripe webhooks**: Implement for reliable payment verification
- **Database**: Switch to PostgreSQL for production (Drizzle schemas ready)
- **Media processing**: Implement actual download backends for production use

### Stripe Integration

- Always use test keys during development
- Implement webhook signature verification in production
- Add proper error handling for payment failures
- Store payment records securely

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use provided UI components from shadcn/ui
- Write descriptive commit messages
- Test both free and premium download flows
- Ensure responsive design works on mobile

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Stripe](https://stripe.com) for secure payment processing
- [Replit](https://replit.com) for development environment
- Contributors and testers who help improve MediaHub

---

**Made with ❤️ for the community**

For support, feature requests, or contributions, please visit our GitHub repository or contact the development team.