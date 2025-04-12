## Setting Up a CI/CD Pipeline with GitHub Actions

This project will teach you how to implement continuous integration and continuous deployment for a simple web application using GitHub Actions. You'll learn how to automate testing, building, and deploying code whenever changes are pushed to your repository.

## What is CI/CD?
Continuous Integration (CI) refers to the practice of frequently integrating code changes into a shared repository. This is usually done multiple times a day to ensure code quality and reduce integration issues. CI often involves automated builds and tests to catch errors early in the development process.

Continuous Deployment (CD) is the practice of automatically deploying code to production after successful testing. It removes the need for manual intervention and speeds up the delivery process. If the tests pass and the build is successful, the code is automatically deployed to the chosen platform.

## Benefits of CI/CD:
Faster delivery of features and bug fixes

Early detection of errors through automated testing

Reduced manual errors in deployment

Ensures consistent and repeatable builds and deployments

### Prerequisites
- GitHub account
- Basic knowledge of Git
- Simple web application (e.g., a basic Node.js, Python, or static HTML application)
- Free-tier cloud hosting account (e.g., Heroku, Netlify, or Vercel)

### Step-by-Step Instructions

#### Step 1: Prepare Your Express.js Application
1. Create a new GitHub repository for your project
2. Set up your Express.js application with the following file structure:

```
express-cicd-demo/
├── app.js               # Main Express application
├── server.js            # Server startup
├── routes/
│   └── index.js         # Route definitions
├── test/
│   └── app.test.js      # Jest tests
└── package.json         # Project configuration
```

3. Create `app.js` with the following content:

```javascript
const express = require('express');
const path = require('path');
const routes = require('./routes/index');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', routes);

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not Found' } });
});

module.exports = app;
```

4. Create `server.js`:

```javascript
const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

5. Create a directory called `routes` and add `index.js`:

```javascript
const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to our API!' });
});

// API route
router.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// User route with parameter
router.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  // In a real app, you would fetch the user from a database
  if (userId === '123') {
    return res.json({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  }
  res.status(404).json({ error: { message: 'User not found' } });
});

module.exports = router;
```

6. Create a directory called `test` and add `app.test.js`:

```javascript
const request = require('supertest');
const app = require('./app');

describe('Express Application', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Welcome to our API!');
  });

  test('GET /api/status should return status info', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('GET /api/users/123 should return user data', async () => {
    const response = await request(app).get('/api/users/123');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id', '123');
    expect(response.body).toHaveProperty('name', 'John Doe');
    expect(response.body).toHaveProperty('email', 'john@example.com');
  });

  test('GET /api/users/999 should return 404', async () => {
    const response = await request(app).get('/api/users/999');
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toHaveProperty('message', 'User not found');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toHaveProperty('message', 'Not Found');
  });
});
```

7. Create a `package.json` file:

```json
{
  "name": "express-sample-app",
  "version": "1.0.0",
  "description": "Sample Express.js application for CI/CD pipeline demo",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "keywords": [
    "express",
    "api",
    "cicd"
  ],
  "author": "caesarsage",
  "license": "MIT",
  "dependencies": {
    "ejs": "^3.1.9",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "nodemon": "^2.0.22",
    "supertest": "^6.3.3"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/"
    ]
  }
}
```

8. Install dependencies and test locally:

```bash
npm install
npm test
```

9. Commit all files to your GitHub repository:

```bash
git add .
git commit -m "Initial commit with Express.js application"
```

#### Step 2: Create a GitHub Actions Workflow File
1. Create a `.github/workflows` directory in your repository
2. Create a file named `ci-cd.yml` inside this directory with the following content:

```yaml
name: CI/CD Pipeline for Node.js

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "16"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Generate test coverage report
        run: npm run test:coverage

      - name: Archive code coverage results
        uses: actions/upload-artifact@v4
        with:
          name: code-coverage-report
          path: coverage/

  deploy:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        uses: some-deployment-action@v1 # Replace with appropriate deployment action
        with:
          # Add deployment configuration
          api_token: ${{ secrets.DEPLOY_TOKEN }}

```

This workflow does the following:

- Runs whenever code is pushed to the main branch or a pull request is created against main
- Sets up a Node.js environment
- Installs dependencies using `npm ci` (clean install)
- Runs tests
- Generates and archives a test coverage report
- Deploys to your desired/setup cloud platform if the tests pass and the event is a push to main


#### Step 3: Test Your CI/CD Pipeline

1. Make a change to your application, for example, update the welcome message in `routes/index.js`:
   ```javascript
   // Home route
   router.get('/', (req, res) => {
     res.json({ message: 'Welcome to our Express API with CI/CD!' });
   });
   ```

2. Update the corresponding test in `test/app.test.js`:
   ```javascript
   test('GET / should return welcome message', async () => {
     const response = await request(app).get('/');
     expect(response.statusCode).toBe(200);
     expect(response.body.message).toBe('Welcome to our Express API with CI/CD!');
   });
   ```

3. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Update welcome message"
   git push origin main
   ```

4. Go to the "Actions" tab in your GitHub repository

<!-- add image -->
!["Actions"](./app/assets/cicd.png)

5. Watch the workflow run and verify that:
   - Tests are executed successfully
   - The application is deployed


#### Step 4: Create a Pull Request Workflow

Let's enhance our CI/CD pipeline by adding a separate workflow for pull requests:

1. Create a file named `.github/workflows/pull-request.yml`:

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install ESLint
      run: npm install eslint eslint-plugin-node --save-dev

    - name: Create ESLint config
      run: |
        echo '{
          "env": {
            "node": true,
            "jest": true
          },
          "extends": ["eslint:recommended", "plugin:node/recommended"],
          "rules": {
            "node/exports-style": ["error", "module.exports"],
            "node/no-unsupported-features/es-syntax": "off"
          }
        }' > .eslintrc.json

    - name: Run ESLint
      run: npx eslint .

  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Generate test coverage report
      run: npm run test:coverage

    - name: Report test coverage as PR comment
      uses: romeovs/lcov-reporter-action@v0.3.1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        lcov-file: ./coverage/lcov.info
```

2. Create a branch to test the pull request workflow:
   ```bash
   git checkout -b feature/add-new-endpoint
   ```

3. Add a new endpoint in `routes/index.js`:
   ```javascript
   // Health check route
   router.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       version: '1.0.0',
       environment: process.env.NODE_ENV || 'development'
     });
   });
   ```

4. Add a test for the new endpoint in `test/app.test.js`:
   ```javascript
   test('GET /health should return health status', async () => {
     const response = await request(app).get('/health');
     expect(response.statusCode).toBe(200);
     expect(response.body).toHaveProperty('status', 'healthy');
     expect(response.body).toHaveProperty('version');
     expect(response.body).toHaveProperty('environment');
   });
   ```

5. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Add health check endpoint"
   git push origin feature/add-new-endpoint
   ```

6. Create a pull request on GitHub from `feature/add-new-endpoint` to `main`
7. Observe how the pull request workflow runs linting and tests
8. After the checks pass, merge the pull request
9. Watch how the main workflow runs and deploys the changes to Heroku

#### Step 5: Monitor and Maintain Your CI/CD Pipeline

1. Regularly check the "Actions" tab in your GitHub repository to monitor the status of your workflows
   
2. Update your workflows as needed to accommodate changes in your application or deployment process
3. Consider adding more advanced features like notifications, deployment to multiple environments, or integration with other tools (e.g., Slack, Discord) for better visibility and collaboration
4. Explore GitHub Actions Marketplace for additional actions that can enhance your CI/CD pipeline
5. Keep your dependencies up to date and regularly review your CI/CD pipeline for improvements
6. Consider adding security checks, performance tests, and other quality gates to your CI/CD pipeline
7. Document your CI/CD pipeline and workflows for future reference and onboarding new team members
8. Share your CI/CD pipeline with the community and contribute to open-source projects to learn from others and improve your skills
9.  Continuously learn and adapt your CI/CD practices based on industry trends and best practices
