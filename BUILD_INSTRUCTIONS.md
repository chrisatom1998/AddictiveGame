# How to Build and Run the App

## Android App Build

1.  **Open the project in Android Studio:**
    *   Open Android Studio.
    *   Click on "Open" or "Open an Existing Project".
    *   Navigate to the root directory of this project and select it.

2.  **Sync the project with Gradle:**
    *   Android Studio should automatically detect the project and sync it with Gradle. If not, click on "Sync Project with Gradle Files" (elephant icon) in the toolbar.

3.  **Run the app:**
    *   Connect an Android device to your computer or set up an Android emulator.
    *   Click on the "Run 'app'" button (green play icon) in the toolbar.
    *   Select the device or emulator you want to run the app on.

4.  **The app should now build and run on your selected device/emulator.**

## Testing the JavaScript Game Logic

This project includes comprehensive JavaScript testing using Jest framework.

### Prerequisites for Testing

1. **Install Node.js** (if not already installed):
   - Download from [nodejs.org](https://nodejs.org/)
   - Recommended version: 16.x or higher

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (auto-restart on changes)
npm run test:watch

# Run tests for CI/CD (single run, no watch)
npm run test:ci
```

### Test Coverage

The testing suite includes:
- **112 tests** across 5 test suites
- **Unit tests** for core game components (Tile, Board, Currency, Game)
- **Integration tests** for game flow and system interactions
- **Edge case testing** for error handling and boundary conditions

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Development Workflow

### For Game Logic Development

1. **Make changes** to JavaScript files in `app/src/main/assets/js/`
2. **Run tests** to verify functionality:
   ```bash
   npm test
   ```
3. **Add new tests** for new features
4. **Build Android app** to test integration

### For Android Development

1. **Open project** in Android Studio
2. **Make changes** to Android components
3. **Sync and build** the project
4. **Test on device/emulator**

## Project Structure

```
AddictiveGame/
├── app/                          # Android app
│   └── src/main/
│       ├── java/                 # Android Java code
│       ├── assets/               # Game assets
│       │   ├── index.html        # Main game entry
│       │   ├── js/               # Game JavaScript
│       │   └── css/              # Game styles
│       └── res/                  # Android resources
├── tests/                        # JavaScript tests
│   ├── core/                     # Core system tests
│   ├── puzzle/                   # Puzzle game tests
│   ├── economy/                  # Currency tests
│   └── integration/              # Integration tests
├── package.json                  # Node.js dependencies
├── BUILD_INSTRUCTIONS.md         # This file
├── TESTING.md                    # Testing documentation
└── README.md                     # Project overview
```

## Troubleshooting

### Android Build Issues

- **Gradle sync fails**: Check internet connection and Android Studio version
- **Device not recognized**: Enable USB debugging on Android device
- **Build errors**: Clean and rebuild project (Build → Clean Project)

### Testing Issues

- **npm install fails**: Check Node.js version and network connection
- **Tests fail**: Ensure no syntax errors in game code
- **Coverage issues**: Run `npm run test:coverage` for detailed report

### Development Tips

- **Use Android Studio emulator** for consistent testing
- **Run tests frequently** during development
- **Check console logs** in WebView for JavaScript errors
- **Test on multiple devices** for compatibility

For detailed game documentation, see [README.md](README.md).
For comprehensive testing information, see [TESTING.md](TESTING.md).
