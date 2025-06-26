# Flavor Table 🍽️

A modern recipe discovery application that allows users to search for recipes based on ingredients using the Spoonacular API. Built with Node.js, Express, and vanilla JavaScript.

## Features

- 🔍 **Search Recipes by Ingredients**: Find recipes based on what you have in your kitchen
- 🎲 **Random Recipe Discovery**: Get inspired with random recipe suggestions
- ❤️ **Favorites System**: Save and manage your favorite recipes locally
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful interface with smooth animations and food-themed background
- ⚡ **Fast & Reliable**: Comprehensive error handling and loading states

## Screenshots

The application features a beautiful, modern interface with:
- Food-themed background imagery
- Smooth navigation between sections
- Professional styling with Google Fonts
- Responsive grid layout for recipe cards
- Modal dialogs for detailed recipe views

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for API requests
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Async/await, DOM manipulation
- **Google Fonts** - Typography (Poppins)

### API
- **Spoonacular API** - Recipe and food data


## Project Structure

```
Flavor-Table/
├── node_modules/          # Dependencies
├── public/                # Static files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   ├── app.js           # Frontend JavaScript
│   └── background.jpg   # Background image
├── routes/               # Express routes
│   ├── home.js          # Home route
│   └── recipes.js       # Recipe API routes
├── .env                 # Environment variables
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
├── package.json        # Project dependencies
├── package-lock.json   # Dependency lock file
├── server.js           # Main server file
└── README.md           # This file
```

## API Endpoints

### GET `/`
Serves the main HTML page

### GET `/recipes/search?ingredients=<ingredients>`
Search for recipes by ingredients
- **Parameters**: `ingredients` (comma-separated list)
- **Example**: `/recipes/search?ingredients=chicken,rice,tomato`

### GET `/recipes/random`
Get a random recipe
- **Returns**: Single random recipe with instructions and ingredients

### GET `/recipes/:id`
Get detailed information about a specific recipe
- **Parameters**: `id` (recipe ID)
- **Returns**: Detailed recipe information including summary, cooking time, instructions, and ingredients

## Usage

### Searching for Recipes
1. Enter ingredients in the search box (e.g., "chicken, rice, tomato")
2. Click "Search Recipes"
3. Browse the results showing used and missing ingredients
4. Click "View Details" for complete recipe information
5. Click "Save to Favorites" to save recipes locally

### Random Recipe Discovery
1. Navigate to the "Random Recipe" section
2. Click "Generate Random Recipe"
3. Explore the randomly suggested recipe
4. Save interesting recipes to your favorites

### Managing Favorites
1. Go to the "Favorites" section
2. View all your saved recipes
3. Click "View Details" to see full recipe information
4. Click "Remove" to delete recipes from favorites

## Error Handling

The application includes comprehensive error handling for:
- Invalid API keys
- Network connectivity issues
- API rate limiting
- Missing or invalid recipe data
- Empty search results
- Server timeouts

## Development

### Running in Development Mode
```bash
npm run dev  # If nodemon is installed
# or
node server.js
```

### Environment Variables
- `SPOONACULAR_API_KEY`: Your Spoonacular API key (required)
- `PORT`: Server port (default: 3000)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the package.json file for details.

## Acknowledgments

- [Spoonacular API](https://spoonacular.com/food-api) for providing comprehensive recipe data
- [Google Fonts](https://fonts.google.com/) for the Poppins font family
- Background image from Adobe Stock

## Support

If you encounter any issues:
1. Check that your API key is correctly set in the `.env` file
2. Ensure you have an active internet connection
3. Verify that the Spoonacular API service is operational
4. Check the browser console for any JavaScript errors

For additional help, please open an issue in the repository.

---

**Happy Cooking! 🍳**

# Flavors-Table
