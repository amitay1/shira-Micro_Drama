# Shira Streaming Platform - Backend API

Backend API server for Shira vertical streaming platform built with Node.js, Express, PostgreSQL, MongoDB, and Redis.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- FFmpeg (for video processing)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Set up database credentials, AWS keys, etc.

# Run database migrations
npm run migrate

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL connection
│   │   ├── mongodb.js    # MongoDB connection
│   │   └── redis.js      # Redis cache
│   ├── models/           # Database models (Sequelize & Mongoose)
│   │   ├── User.js
│   │   ├── Series.js
│   │   ├── Episode.js
│   │   ├── Subscription.js
│   │   ├── CoinBalance.js
│   │   ├── CoinTransaction.js
│   │   └── PlaybackSession.js
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Authentication
│   │   ├── users.js      # User management
│   │   ├── series.js     # Series endpoints
│   │   ├── episodes.js   # Episode endpoints
│   │   ├── playback.js   # Video playback
│   │   ├── purchases.js  # In-app purchases
│   │   ├── subscriptions.js
│   │   ├── feed.js       # Content discovery
│   │   ├── search.js
│   │   └── admin.js      # Admin panel APIs
│   ├── controllers/      # Business logic
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js       # JWT authentication
│   │   └── errorHandler.js
│   ├── services/         # External services
│   │   ├── video.js      # Video transcoding
│   │   ├── drm.js        # DRM management
│   │   ├── payment.js    # Payment processing
│   │   ├── notification.js # Push notifications
│   │   └── storage.js    # S3/Cloud storage
│   ├── utils/            # Utility functions
│   │   └── logger.js     # Winston logger
│   └── app.js            # Main application
├── tests/                # Test files
├── logs/                 # Application logs
├── package.json
├── .env.example
└── README.md
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables:

### Core Settings
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `API_VERSION` - API version (default: v1)

### Databases
- PostgreSQL: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- MongoDB: `MONGO_URI`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### Authentication
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRY` - Token expiration (default: 7d)

### AWS Services
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_VIDEO`, `S3_BUCKET_THUMBNAILS`
- `CLOUDFRONT_DOMAIN`

### Payment Providers
- Apple: `APPLE_SHARED_SECRET`, `APPLE_KEY_ID`
- Google: `GOOGLE_SERVICE_ACCOUNT_PATH`
- Stripe: `STRIPE_SECRET_KEY`

### External Services
- Firebase: `FIREBASE_SERVICE_ACCOUNT_PATH`
- Email: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email

### Users (Protected)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile
- `GET /users/me/subscription` - Get subscription status
- `GET /users/me/coins` - Get coin balance
- `GET /users/me/watch-history` - Get watch history
- `POST /users/me/avatar` - Upload profile picture

### Content Discovery
- `GET /feed` - Main content feed
- `GET /feed/trending` - Trending series
- `GET /feed/recommended` - Personalized recommendations
- `GET /feed/continue-watching` - Continue watching
- `GET /series` - List all series
- `GET /series/:id` - Get series details
- `GET /series/:id/episodes` - Get episodes for series
- `GET /episodes/:id` - Get episode details
- `GET /search?q=query` - Search content

### Playback (Protected)
- `GET /episodes/:id/manifest` - Get HLS/DASH manifest
- `POST /episodes/:id/unlock` - Unlock episode with coins
- `GET /episodes/:id/license` - Get DRM license
- `POST /playback/start` - Start playback session
- `POST /playback/heartbeat` - Update playback progress
- `POST /playback/complete` - Complete playback
- `PUT /playback/progress` - Save progress

### Purchases (Protected)
- `POST /purchases/coins` - Purchase coins
- `POST /purchases/verify` - Verify store receipt
- `POST /subscriptions/subscribe` - Subscribe to plan
- `POST /subscriptions/cancel` - Cancel subscription
- `GET /subscriptions/plans` - Get available plans
- `POST /subscriptions/restore` - Restore purchases

### Admin (Admin Only)
- `GET /admin/users` - List all users
- `POST /admin/series` - Create new series
- `POST /admin/episodes` - Upload new episode
- `PUT /admin/series/:id` - Update series
- `DELETE /admin/episodes/:id` - Delete episode
- `GET /admin/analytics` - View analytics

## 🔐 Authentication

All protected routes require JWT token in Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema

### PostgreSQL Tables
- `users` - User accounts
- `series` - Content series
- `seasons` - Series seasons
- `episodes` - Video episodes
- `subscriptions` - User subscriptions
- `coin_balances` - User coin balances
- `coin_transactions` - Coin transaction history
- `playback_sessions` - Viewing sessions
- `purchases` - Purchase records

### MongoDB Collections
- `analytics` - User analytics events
- `logs` - Application logs
- `notifications` - Notification records

### Redis Keys
- `user:{userId}` - User cache
- `session:{sessionId}` - Session data
- `blacklist:{token}` - Blacklisted tokens
- `rate_limit:{ip}` - Rate limiting

## 🎥 Video Processing Pipeline

1. **Upload** - Video uploaded to S3
2. **Transcoding** - FFmpeg creates ABR ladder
   - 240p @ 300 kbps
   - 360p @ 600 kbps
   - 540p @ 1.2 Mbps
   - 720p @ 1.8 Mbps
   - 1080p @ 3.0 Mbps
3. **Packaging** - HLS/DASH manifests generated
4. **DRM** - Content encrypted with FairPlay/Widevine
5. **CDN** - Distributed via CloudFront

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention
- XSS protection

## 📈 Monitoring & Logging

- Winston for structured logging
- Request/response logging
- Error tracking
- Performance metrics
- Database query logging

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- users.test.js
```

## 🚀 Deployment

### Using Docker

```bash
# Build image
docker build -t shira-backend .

# Run container
docker run -p 3000:3000 --env-file .env shira-backend
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/app.js --name shira-backend

# View logs
pm2 logs shira-backend

# Restart
pm2 restart shira-backend
```

## 📝 Next Steps

1. Set up databases (PostgreSQL, MongoDB, Redis)
2. Configure environment variables in `.env`
3. Set up AWS S3 buckets for video storage
4. Configure CDN (CloudFront/Cloudflare)
5. Set up DRM providers (BuyDRM/EZDRM)
6. Configure payment providers (Apple, Google, Stripe)
7. Set up Firebase for push notifications
8. Run migrations and seed data
9. Start development server
10. Test API endpoints

## 🤝 Team Collaboration

This is a collaborative project. When you encounter a step that requires external setup (AWS, Apple Developer, etc.), stop and notify the team member responsible for that setup.

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)
- [Video Pipeline](./docs/video-pipeline.md)
- [Payment Integration](./docs/payments.md)
- [DRM Setup](./docs/drm.md)

## ⚠️ Important Notes

- Never commit `.env` file to version control
- Always use environment variables for secrets
- Test payment flows in sandbox before production
- Monitor video transcoding costs
- Implement proper error handling
- Use caching for frequently accessed data
- Keep dependencies updated
- Follow security best practices

## 📞 Support

For questions or issues, contact the development team.

---

**Built with ❤️ for Shira Streaming Platform**
