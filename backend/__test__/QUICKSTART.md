# Quick Start Guide - Running Tests

## Prerequisites

1. **PostgreSQL Database**
   - Ensure PostgreSQL is installed and running
   - Create test database:
   ```sql
   CREATE DATABASE readlens_test;
   ```

2. **Dependencies**
   - Jest, Supertest already installed ✅
   - All required packages in package.json

## Setup (First Time)

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Create test database
psql -U postgres -c "CREATE DATABASE readlens_test;"

# Or using Sequelize CLI
npx sequelize-cli db:create --env test
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run all tests with coverage report
npm run test:coverage

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with verbose output
npm run test:verbose
```

### Run Specific Tests

```bash
# Run single test file
npm test -- __test__/helpers.test.js

# Run tests matching a pattern
npm test -- -t "User Controller"

# Run tests in a specific describe block
npm test -- -t "should register a new user"
```

## Test Files Overview

| File | What It Tests | Test Count |
|------|---------------|------------|
| `migration.test.js` | Database schema & migrations | 25+ |
| `helpers.test.js` | Bcrypt & JWT functions | 23+ |
| `middlewares.test.js` | Auth & error handling | 35+ |
| `openLibrary.test.js` | External API integration | 30+ |
| `models.test.js` | Database models | 60+ |
| `userController.test.js` | User API endpoints | 40+ |
| `bookController.test.js` | Book API endpoints | 55+ |
| `integration.test.js` | End-to-end workflows | 25+ |

## Expected Output

### Successful Test Run
```
PASS  __test__/helpers.test.js
PASS  __test__/middlewares.test.js
PASS  __test__/openLibrary.test.js
PASS  __test__/models.test.js
PASS  __test__/userController.test.js
PASS  __test__/bookController.test.js
PASS  __test__/integration.test.js
PASS  __test__/migration.test.js

Test Suites: 8 passed, 8 total
Tests:       290 passed, 290 total
Time:        XX.XXs
```

### Coverage Report
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.50 |    80.25 |   87.30 |   85.50 |
 controllers/         |   92.50 |    88.75 |   95.00 |   92.50 |
 helpers/             |  100.00 |   100.00 |  100.00 |  100.00 |
 middlewares/         |  100.00 |   100.00 |  100.00 |  100.00 |
 models/              |   88.00 |    75.50 |   90.00 |   88.00 |
 services/            |   85.00 |    80.00 |   85.00 |   85.00 |
----------------------|---------|----------|---------|---------|
```

## Troubleshooting

### Issue: Database connection error
**Solution:** Ensure PostgreSQL is running and test database exists
```bash
psql -U postgres -l  # List all databases
```

### Issue: "NODE_ENV is not recognized" (Windows)
**Solution:** Tests will still run, or install cross-env:
```bash
npm install --save-dev cross-env
```

### Issue: Tests timeout
**Solution:** Tests have 10s timeout. Increase if needed in `jest.config.js`

### Issue: Port already in use
**Solution:** Tests don't actually start the server on port 3000, they use supertest

### Issue: Tests fail with "cannot find module"
**Solution:** Ensure all dependencies are installed:
```bash
npm install
```

## Understanding Test Results

### ✅ PASS - Test Passed
All assertions in the test passed successfully

### ❌ FAIL - Test Failed
One or more assertions failed. Check the error message for details

### ⏭️ SKIP - Test Skipped
Test was skipped (usually with `test.skip()` or `xit()`)

### 🔄 PENDING - Test Pending
Test is defined but has no implementation (using `test()` with no callback)

## Next Steps

1. **View Coverage Report**
   ```bash
   npm run test:coverage
   # Open: coverage/lcov-report/index.html
   ```

2. **Run Specific Test File**
   ```bash
   npm test -- __test__/userController.test.js
   ```

3. **Debug a Test**
   - Add `console.log()` in test
   - Run with verbose mode
   - Use VS Code debugger

4. **Add More Tests**
   - Follow existing patterns
   - Maintain coverage above 80%
   - Update documentation

## Common Test Patterns

### Testing API Endpoints
```javascript
const response = await request(app)
  .post('/register')
  .send({ email, password, username })
  .expect(201);

expect(response.body.user.email).toBe(email);
```

### Testing with Authentication
```javascript
const token = generateToken({ id: user.id });

await request(app)
  .post('/book/OL1234W/like')
  .set('Authorization', `Bearer ${token}`)
  .expect(201);
```

### Testing Database Operations
```javascript
const user = await User.create({ email, password, username });
expect(user.id).toBeDefined();
```

## Tips

1. **Run tests frequently** during development
2. **Check coverage** to ensure new code is tested
3. **Read test output** carefully for error details
4. **Keep tests fast** by using database transactions
5. **Mock external APIs** to avoid network dependencies

## Need Help?

1. Check `__test__/README.md` for detailed documentation
2. Review existing test files for examples
3. Read error messages carefully
4. Ensure database is configured correctly

---

**You're all set!** Run `npm test` to verify everything works.
