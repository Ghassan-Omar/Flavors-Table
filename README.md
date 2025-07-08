# 🍽️ Flavor Table 3.0 - Recipe Discovery with Authentication

A modern, full-stack recipe discovery application that allows users to search for recipes based on ingredients using the Spoonacular API, with user authentication and personal recipe management capabilities.

## ✨ Features

### Core Features
- 🔍 **Recipe Search**: Search for recipes by ingredients using the Spoonacular API
- 🎲 **Random Recipe Generator**: Discover new recipes with a single click
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful, food-themed interface with smooth animations

### Authentication & User Management
- 🔐 **User Registration & Login**: Secure JWT-based authentication
- 👤 **User Profiles**: Manage personal account information
- 🔒 **Protected Routes**: Secure API endpoints with middleware
- 🚪 **Session Management**: Automatic token handling and logout

### Recipe Management
- ❤️ **Save Favorites**: Save recipes to personal collection (requires login)
- ✏️ **Edit Recipes**: Modify saved recipe details
- 🗑️ **Delete Recipes**: Remove recipes from favorites
- 📋 **Recipe Details**: View comprehensive recipe information
- 🥘 **Ingredient Lists**: Detailed ingredient information
- ⏱️ **Cooking Times**: Recipe preparation and cooking times

### Technical Features
- 🗄️ **PostgreSQL Database**: Persistent data storage
- 🔄 **CRUD Operations**: Full Create, Read, Update, Delete functionality
- 🛡️ **Security**: Password hashing, JWT tokens, input validation
- 🌐 **RESTful API**: Well-structured API endpoints
- 📊 **Error Handling**: Comprehensive error management
- 🚀 **Deployment Ready**: Configured for production deployment

## 🏗️ Architecture

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Flexbox/Grid, animations, and responsive design
- **Vanilla JavaScript**: ES6+ features, async/await, fetch API
- **Authentication**: JWT token management, automatic login/logout

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database with JSONB support
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing and security

### External APIs
- **Spoonacular API**: Recipe data and search functionality

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (v16.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v12 or higher)
- **Spoonacular API Key** (free registration at [spoonacular.com](https://spoonacular.com/food-api))

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Flavor-Table.git
cd Flavor-Table
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U your_username

# Create database
CREATE DATABASE flavor_table;

# Create user (optional)
CREATE USER flavor_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE flavor_table TO flavor_user;

# Exit psql
\q
```

#### Run Database Migrations

```bash
# Connect to your database
psql -U your_username -d flavor_table

# Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

# Create recipes table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image TEXT,
    instructions TEXT,
    ingredients JSONB,
    readyIn INTEGER,
    spoonacular_id INTEGER,
    UNIQUE(user_id, spoonacular_id)
);

# Create indexes for better performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_spoonacular_id ON recipes(spoonacular_id);

# Exit psql
\q
```

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Spoonacular API Key (get from https://spoonacular.com/food-api)
SPOONACULAR_API_KEY=your_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/flavor_table

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_super_secure_jwt_secret_key_here
```

### 5. Start the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <jwt_token>
```

### Recipe Endpoints

#### Search Recipes (Public)
```http
GET /recipes/search?ingredients=chicken,rice,tomato
```

#### Get Random Recipe (Public)
```http
GET /recipes/random
```

#### Get Recipe Details (Public)
```http
GET /recipes/:id
```

#### Get User's Favorite Recipes (Protected)
```http
GET /recipes/all
Authorization: Bearer <jwt_token>
```

#### Save Recipe to Favorites (Protected)
```http
POST /recipes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Chicken Rice Bowl",
  "image": "https://example.com/image.jpg",
  "instructions": "Cook chicken...",
  "ingredients": ["chicken", "rice", "tomato"],
  "readyIn": 30,
  "spoonacular_id": 12345
}
```

#### Update Favorite Recipe (Protected)
```http
PUT /recipes/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Recipe Title",
  "instructions": "Updated instructions...",
  "ingredients": ["updated", "ingredients"],
  "readyIn": 25
}
```

#### Delete Favorite Recipe (Protected)
```http
DELETE /recipes/:id
Authorization: Bearer <jwt_token>
```

### User Management Endpoints

#### Get All Users (Protected)
```http
GET /users
Authorization: Bearer <jwt_token>
```

#### Get User by ID (Protected)
```http
GET /users/:id
Authorization: Bearer <jwt_token>
```

#### Update User (Protected)
```http
PUT /users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### Change Password (Protected)
```http
PUT /users/:id/password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Delete User (Protected)
```http
DELETE /users/:id
Authorization: Bearer <jwt_token>
```

## 🧪 Testing with Postman

### Import Collection

1. Open Postman
2. Click "Import" button
3. Select the `Flavor-Table-Postman-Collection.json` file
4. The collection will be imported with all endpoints

### Environment Setup

1. Create a new environment in Postman
2. Add the following variables:
   - `base_url`: `http://localhost:3000`
   - `auth_token`: (will be set automatically after login)

### Testing Workflow

1. **Register a new user** using the registration endpoint
2. **Login** to get a JWT token (automatically saved to environment)
3. **Test protected endpoints** (favorites, user management)
4. **Test public endpoints** (search, random recipes)

## 🚀 Deployment

### Render.com Deployment

1. **Prepare for Deployment**
   ```bash
   # Ensure all environment variables are set
   # Update CORS settings in server.js for production domain
   ```

2. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

3. **Deploy Database**
   - Create a new PostgreSQL database on Render
   - Note the connection string

4. **Deploy Backend**
   - Create a new Web Service
   - Connect to your GitHub repository
   - Set environment variables:
     - `DATABASE_URL`: Your Render PostgreSQL connection string
     - `SPOONACULAR_API_KEY`: Your API key
     - `JWT_SECRET`: Your JWT secret
     - `NODE_ENV`: `production`

5. **Run Database Migrations**
   - Use Render's shell to run migration commands
   - Or connect to the database directly and run SQL commands

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
SPOONACULAR_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
PORT=10000
```

## 📁 Project Structure

```
Flavor-Table/
├── public/                 # Frontend files
│   ├── index.html         # Main application page
│   ├── auth.html          # Login/registration page
│   ├── favorites.html     # Favorites management page
│   ├── app.js            # Main application JavaScript
│   ├── auth.js           # Authentication JavaScript
│   ├── favorites.js      # Favorites management JavaScript
│   └── styles.css        # Application styles
├── routes/                # Backend route handlers
│   ├── auth.js           # Authentication routes
│   ├── home.js           # Home page route
│   ├── recipes.js        # Recipe CRUD routes
│   └── users.js          # User management routes
├── middleware/            # Custom middleware
│   └── verifyToken.js    # JWT verification middleware
├── database_migration.sql # Database schema migration
├── server.js             # Main server file
├── package.json          # Project dependencies
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🔧 Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run database migrations
npm run migrate

# Check API health
curl http://localhost:3000/health
```

### Code Style

- Use ES6+ features
- Follow RESTful API conventions
- Implement proper error handling
- Use meaningful variable names
- Add comments for complex logic

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin resource sharing
- **Error Handling**: Secure error messages (no sensitive data exposure)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Ensure database exists and user has permissions

2. **API Key Issues**
   - Verify SPOONACULAR_API_KEY is correct
   - Check API quota limits
   - Ensure API key is active

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration (24 hours)
   - Clear localStorage and login again

4. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📊 Performance Considerations

- Database indexes on frequently queried columns
- Connection pooling for database connections
- JWT token expiration management
- Image lazy loading
- API request caching (future enhancement)

## 🔮 Future Enhancements

- [ ] Recipe rating and reviews
- [ ] Social features (sharing recipes)
- [ ] Meal planning functionality
- [ ] Shopping list generation
- [ ] Recipe recommendations
- [ ] Image upload for custom recipes
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Recipe categories and tags
- [ ] Advanced search filters

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include error messages and steps to reproduce

## 🙏 Acknowledgments

- [Spoonacular API](https://spoonacular.com/food-api) for recipe data
- [Express.js](https://expressjs.com/) for the web framework
- [PostgreSQL](https://www.postgresql.org/) for the database
- [JWT](https://jwt.io/) for authentication
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing

---

**Made with ❤️ by the Ghassan Omar**
