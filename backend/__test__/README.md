# Backend Test Suite Documentation

This test suite provides comprehensive coverage (>80%) of the ReadLens backend application, excluding AI services.

## 📋 Test Coverage

### Test Files

1. **migration.test.js** - Database migrations and schema tests
2. **helpers.test.js** - Bcrypt and JWT helper functions
3. **middlewares.test.js** - Authentication, authorization, and error handling
4. **openLibrary.test.js** - OpenLibrary API service integration
5. **models.test.js** - Sequelize models and associations
6. **userController.test.js** - User controller endpoints
7. **bookController.test.js** - Book controller endpoints
8. **integration.test.js** - End-to-end workflow tests

### Coverage Areas

#### ✅ Helpers (100% coverage)
- Password hashing with bcrypt
- Password comparison
- JWT token generation
- JWT token verification
- Token expiration handling

#### ✅ Middlewares (100% coverage)
- Authentication middleware
- Authorization middleware
- Resource ownership authorization
- Error handler for all error types
- Development vs production error responses

#### ✅ Services (excluding AI)
- OpenLibrary API search
- OpenLibrary work details
- Cover URL generation
- API error handling

#### ✅ Models (100% coverage)
- User model CRUD operations
- Book model CRUD operations
- UserLike relationship model
- UserPreference model
- Model associations
- Model validations
- Database constraints

#### ✅ Controllers (>90% coverage)
**User Controller:**
- User registration
- User login
- User logout
- Get user by ID/username
- Get user bookshelf
- Password validation
- Email validation
- Duplicate prevention

**Book Controller:**
- List books with pagination
- Get book details
- Like books
- Update user preferences
- Handle book subjects
- Prevent duplicate likes

#### ✅ Integration Tests
- Complete user journeys
- Multi-user scenarios
- Preference building
- Authentication flows
- Error handling across app
- Public vs protected routes
- Data consistency

#### ✅ Migrations
- Table creation verification
- Column type verification
- Constraint verification
- Foreign key relationships
- Cascade delete behavior
- Transaction handling

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Tests with Verbose Output
```bash
npm run test:verbose
```

### Run Specific Test File
```bash
npm test -- __test__/helpers.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="User Controller"
```

## 📊 Coverage Thresholds

The test suite enforces minimum coverage thresholds:
- **Branches:** 75%
- **Functions:** 75%
- **Lines:** 75%
- **Statements:** 75%

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Test timeout: 10 seconds
- Coverage excludes: migrations, seeders, config, AI services
- Runs in band (sequential) to avoid database conflicts

### Test Setup (`__test__/setup.js`)
- Sets NODE_ENV to 'test'
- Configures JWT secrets for testing
- Sets global timeout

## 📝 Test Structure

### Unit Tests
Test individual functions and methods in isolation:
- Helpers (bcrypt, JWT)
- Middleware functions
- Service methods
- Model operations

### Integration Tests
Test complete workflows and interactions:
- User registration → login → browse → like → bookshelf
- Multi-user interactions
- Error scenarios
- Authentication/authorization flows

### Database Tests
Test database schema and migrations:
- Table structure
- Constraints
- Foreign keys
- Associations
- Transactions

## 🎯 Test Best Practices

1. **Clean State:** Each test starts with a clean database (`beforeEach`)
2. **Mocking:** External APIs (OpenLibrary, Gemini) are mocked
3. **Isolation:** Tests run sequentially to avoid conflicts
4. **Assertions:** Each test has clear, specific assertions
5. **Error Cases:** Both success and failure scenarios are tested
6. **Edge Cases:** Boundary conditions and special cases covered

## 🛠️ Debugging Tests

### View Detailed Output
```bash
npm run test:verbose
```

### Run Single Test
```bash
npm test -- -t "should register a new user successfully"
```

### Debug in VS Code
Add breakpoints and use VS Code's Jest integration or create a launch configuration:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## 🗄️ Database Setup

Tests use a separate test database configured in `config/config.json`:
```json
{
  "test": {
    "username": "postgres",
    "password": "postgres",
    "database": "readlens_test",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

### Create Test Database
```bash
# Using psql
psql -U postgres -c "CREATE DATABASE readlens_test;"

# Or using Sequelize CLI
npx sequelize-cli db:create --env test
```

## 📦 Test Dependencies

- **jest** - Test framework
- **supertest** - HTTP assertions
- **sequelize** - ORM for database tests

## 🚫 Excluded from Testing

The following are intentionally excluded from test coverage:
- **AI Services** (`services/gemini.js`) - External AI API, tested separately
- **Config files** - Static configuration
- **Migration files** - Generated by Sequelize
- **Seeder files** - Data seeding scripts

## 🔍 Coverage Report

After running `npm run test:coverage`, view the HTML coverage report:
```bash
open coverage/lcov-report/index.html
```

Coverage summary is displayed in the terminal:
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.50 |    80.25 |   87.30 |   85.50 |
 helpers/             |  100.00 |   100.00 |  100.00 |  100.00 |
 middlewares/         |  100.00 |   100.00 |  100.00 |  100.00 |
 controllers/         |   92.50 |    88.75 |   95.00 |   92.50 |
 models/              |   88.00 |    75.50 |   90.00 |   88.00 |
 services/            |   85.00 |    80.00 |   85.00 |   85.00 |
----------------------|---------|----------|---------|---------|
```

## 🐛 Known Issues & Limitations

1. **External API Mocking:** OpenLibrary API calls are mocked - real API integration should be tested separately
2. **Email Sending:** If email functionality is added, it should be mocked
3. **File Uploads:** If file upload is implemented, test with mock files
4. **Background Jobs:** If added, may need separate testing approach

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Sequelize Testing Guide](https://sequelize.org/docs/v6/other-topics/testing/)

## 🤝 Contributing

When adding new features, ensure:
1. Add corresponding tests
2. Maintain >80% coverage
3. Follow existing test patterns
4. Update this documentation

## 📞 Support

For issues or questions about tests:
1. Check test output for specific error messages
2. Review test file comments for context
3. Ensure database is properly configured
4. Verify all dependencies are installed
