# University Registration Backend API

A Node.js/Express REST API for university registration system with lead management functionality.

## Features

- 📚 **University Management**: CRUD operations for universities with course details
- 🎯 **Lead Collection**: Capture student leads with validation and webhook integration
- 🔍 **Search & Pagination**: Search universities with paginated results
- 🌐 **CORS Enabled**: Configured for frontend integration
- 🔗 **Webhook Support**: Forward leads to external services (Pipedream)
- ✅ **Input Validation**: Email, phone, and required field validation
- 🚀 **Production Ready**: Error handling, logging, and graceful shutdown

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Deployment**: Vercel
- **Other**: CORS, dotenv, axios

## API Endpoints

### Health & Info
- `GET /` - API information
- `GET /api/health` - Health check

### Universities
- `GET /api/universities` - List universities (with pagination & search)
- `GET /api/universities/:id` - Get university details

### Leads
- `POST /api/leads` - Submit a new lead

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/university-registration
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/university-registration

# Server
PORT=4000
NODE_ENV=production

# CORS (optional)
FRONTEND_URL=https://your-frontend-domain.com
```

## Local Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI
   ```

3. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000`

## Production Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   In Vercel dashboard, go to your project → Settings → Environment Variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your frontend domain (optional)

### Environment Variables for Vercel

**Required**:
- `MONGO_URI`: MongoDB connection string
  - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
  - For local MongoDB: `mongodb://localhost:27017/dbname`

**Optional**:
- `PORT`: Server port (defaults to 4000)
- `NODE_ENV`: Environment mode (`production` recommended)
- `FRONTEND_URL`: Frontend domain for CORS (defaults to allow all origins)

## API Usage Examples

### Get Universities (with search)
```bash
# Get all universities (paginated)
GET /api/universities?page=1&limit=10

# Search universities
GET /api/universities?search=IIT&page=1&limit=5
```

### Submit a Lead
```bash
POST /api/leads
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "state": "California",
  "courseInterested": "B.Tech Computer Science",
  "intakeYear": "2024",
  "consent": true,
  "pipedreamUrl": "https://your-webhook-url.com" // optional
}
```

## Database Schema

### University Model
```javascript
{
  name: String,
  shortName: String,
  city: String,
  overview: String,
  courses: [{
    name: String,
    duration: String,
    feeRange: { min: Number, max: Number, currency: String },
    intakeMonths: [String]
  }],
  placements: {
    avgPackage: String,
    topRecruiters: [String],
    placementRate: String
  },
  facilities: [String],
  contact: { phone: String, email: String }
}
```

### Lead Model
```javascript
{
  fullName: String,
  email: String,
  phone: String,
  state: String,
  courseInterested: String,
  intakeYear: String,
  consent: Boolean,
  createdAt: Date
}
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample universities

## Error Handling

The API includes comprehensive error handling:
- Input validation errors (400)
- Resource not found errors (404)
- Duplicate lead detection (409)
- Database connection errors (500)
- Global error handler for uncaught exceptions

## Security Features

- Input sanitization and validation
- Email format validation
- Phone number validation (10 digits)
- Duplicate lead prevention
- CORS configuration
- Environment variable protection

## Monitoring

- Health check endpoint at `/api/health`
- Structured error logging
- Request/response logging in development
- Graceful shutdown handling

## License

MIT License

## Support

For issues and questions, please check the API endpoints and ensure all required environment variables are properly configured.