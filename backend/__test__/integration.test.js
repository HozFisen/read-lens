const request = require('supertest');
const app = require('../app');
const { sequelize, User, Book, UserLike, UserPreference } = require('../models');
const OpenLib = require('../services/openLibrary');
const geminiService = require('../services/gemini');

// Mock external services
jest.mock('../services/openLibrary');
jest.mock('../services/gemini');

describe('Integration Tests - End-to-End Workflows', () => {
  // Setup: Clean database before each test
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    jest.clearAllMocks();

    // Setup common mocks
    OpenLib.search.mockResolvedValue({
      numFound: 10,
      docs: [
        {
          key: '/works/OL1234W',
          title: 'JavaScript Patterns',
          author_name: ['Stoyan Stefanov'],
          cover_i: 12345,
          first_publish_year: 2010
        },
        {
          key: '/works/OL5678W',
          title: 'Python Cookbook',
          author_name: ['David Beazley'],
          cover_i: 67890,
          first_publish_year: 2013
        }
      ]
    });

    OpenLib.getWork.mockImplementation((id) => {
      const books = {
        'OL1234W': {
          title: 'JavaScript Patterns',
          description: 'Design patterns in JavaScript',
          subjects: ['Programming', 'JavaScript', 'Design Patterns'],
          covers: [12345]
        },
        'OL5678W': {
          title: 'Python Cookbook',
          description: 'Python recipes',
          subjects: ['Programming', 'Python', 'Cookbook'],
          covers: [67890]
        },
        'OL9999W': {
          title: 'Algorithm Design',
          description: 'Algorithm fundamentals',
          subjects: ['Computer Science', 'Algorithms'],
          covers: [99999]
        }
      };
      return Promise.resolve(books[id] || books['OL1234W']);
    });

    OpenLib.getCoverUrl.mockImplementation((coverId, size) => {
      return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
    });
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe('Complete User Journey: Registration to Book Interaction', () => {
    it('should complete full user journey: register, login, search, view, like books', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          username: 'bookworm'
        })
        .expect(201);

      expect(registerResponse.body.user.username).toBe('bookworm');

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;
      expect(token).toBeDefined();

      // Step 3: Browse books (public)
      const searchResponse = await request(app)
        .get('/?query=programming')
        .expect(200);

      expect(searchResponse.body.books).toHaveLength(2);

      // Step 4: View book details (public)
      const detailResponse = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(detailResponse.body.title).toBe('JavaScript Patterns');
      expect(detailResponse.body.subjects).toContain('Programming');

      // Step 5: Like first book (requires auth)
      const like1Response = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(like1Response.body.message).toBe('Book liked successfully');

      // Step 6: Like second book
      const like2Response = await request(app)
        .post('/book/OL5678W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(like2Response.body.message).toBe('Book liked successfully');

      // Step 7: View user's bookshelf
      const bookshelfResponse = await request(app)
        .get('/user/bookworm/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(bookshelfResponse.body.books).toHaveLength(2);
      expect(bookshelfResponse.body.totalBooks).toBe(2);

      // Step 8: Verify preferences were created
      const user = await User.findOne({ where: { email: 'newuser@example.com' } });
      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      // Should have preferences from both books
      expect(preferences.length).toBeGreaterThan(0);
      const subjects = preferences.map(p => p.subject);
      expect(subjects).toContain('programming');

      // Step 9: Logout
      const logoutResponse = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(logoutResponse.body.message).toBe('Logout successful');
    });
  });

  describe('Multiple Users Interacting with Same Books', () => {
    it('should handle multiple users liking the same books', async () => {
      // Create two users
      const user1Data = {
        email: 'user1@example.com',
        password: 'password123',
        username: 'reader1'
      };

      const user2Data = {
        email: 'user2@example.com',
        password: 'password123',
        username: 'reader2'
      };

      await request(app).post('/register').send(user1Data).expect(201);
      await request(app).post('/register').send(user2Data).expect(201);

      // Login both users
      const login1 = await request(app)
        .post('/login')
        .send({ email: user1Data.email, password: user1Data.password })
        .expect(200);

      const login2 = await request(app)
        .post('/login')
        .send({ email: user2Data.email, password: user2Data.password })
        .expect(200);

      const token1 = login1.body.access_token;
      const token2 = login2.body.access_token;

      // Both users like the same book
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token1}`)
        .expect(201);

      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token2}`)
        .expect(201);

      // Verify only one book record exists
      const books = await Book.findAll({ where: { olid: 'OL1234W' } });
      expect(books).toHaveLength(1);

      // Verify two UserLike records exist
      const likes = await UserLike.findAll({ where: { bookId: books[0].id } });
      expect(likes).toHaveLength(2);

      // Verify each user has their own bookshelf
      const bookshelf1 = await request(app)
        .get('/user/reader1/bookshelf')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const bookshelf2 = await request(app)
        .get('/user/reader2/bookshelf')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(bookshelf1.body.totalBooks).toBe(1);
      expect(bookshelf2.body.totalBooks).toBe(1);
    });
  });

  describe('Preference Building Through Book Likes', () => {
    it('should build user preferences based on liked book subjects', async () => {
      // Register and login
      await request(app)
        .post('/register')
        .send({
          email: 'reader@example.com',
          password: 'password123',
          username: 'avid_reader'
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'reader@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;
      const user = await User.findOne({ where: { email: 'reader@example.com' } });

      // Like first book (Programming, JavaScript, Design Patterns)
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Check preferences after first like
      let preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences).toHaveLength(3);
      expect(preferences.every(p => p.weight === 1)).toBe(true);

      // Like second book (Programming, Python, Cookbook)
      await request(app)
        .post('/book/OL5678W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Check preferences after second like
      preferences = await UserPreference.findAll({
        where: { userId: user.id },
        order: [['weight', 'DESC']]
      });

      // Should have unique subjects
      const uniqueSubjects = new Set(preferences.map(p => p.subject));
      expect(uniqueSubjects.size).toBe(preferences.length);

      // 'Programming' should have weight 2 (appeared in both books)
      const programmingPref = preferences.find(p => p.subject === 'programming');
      expect(programmingPref).toBeDefined();
      expect(programmingPref.weight).toBe(2);

      // Other subjects should have weight 1
      const otherPrefs = preferences.filter(p => p.subject !== 'programming');
      expect(otherPrefs.every(p => p.weight === 1)).toBe(true);
    });

    it('should accumulate preferences across multiple book likes', async () => {
      await request(app)
        .post('/register')
        .send({
          email: 'scholar@example.com',
          password: 'password123',
          username: 'scholar'
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'scholar@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;
      const user = await User.findOne({ where: { email: 'scholar@example.com' } });

      // Like three different books
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app)
        .post('/book/OL5678W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app)
        .post('/book/OL9999W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Check accumulated preferences
      const preferences = await UserPreference.findAll({
        where: { userId: user.id },
        order: [['weight', 'DESC']]
      });

      expect(preferences.length).toBeGreaterThan(0);

      // Verify 'Programming' has highest weight (appeared in 2 books)
      const topPreference = preferences[0];
      expect(topPreference.subject).toBe('programming');
      expect(topPreference.weight).toBe(2);
    });
  });

  describe('Authentication and Authorization Flow', () => {
    it('should protect private routes', async () => {
      // Try to like a book without authentication
      const response1 = await request(app)
        .post('/book/OL1234W/like')
        .expect(401);

      expect(response1.body.error).toBeDefined();

      // Try to access bookshelf without authentication
      const response2 = await request(app)
        .get('/user/someone/bookshelf')
        .expect(401);

      expect(response2.body.error).toBeDefined();

      // Try to logout without authentication
      const response3 = await request(app)
        .post('/logout')
        .expect(401);

      expect(response3.body.error).toBeDefined();
    });

    it('should allow authenticated access to protected routes', async () => {
      // Register and login
      await request(app)
        .post('/register')
        .send({
          email: 'authuser@example.com',
          password: 'password123',
          username: 'authuser'
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'authuser@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Access protected routes with token
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app)
        .get('/user/authuser/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling Across Application', () => {
    it('should handle duplicate registration attempts', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        username: 'duplicate'
      };

      // First registration
      await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should handle invalid login credentials', async () => {
      await request(app)
        .post('/register')
        .send({
          email: 'user@example.com',
          password: 'correctpassword',
          username: 'user'
        })
        .expect(201);

      const response = await request(app)
        .post('/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should handle duplicate book likes', async () => {
      await request(app)
        .post('/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          username: 'user'
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // First like
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Duplicate like
      const response = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toContain('already liked');
    });

    it('should handle non-existent user queries', async () => {
      await request(app)
        .post('/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          username: 'user'
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      const response = await request(app)
        .get('/user/nonexistent/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle OpenLibrary API errors gracefully', async () => {
      OpenLib.search.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    it('should handle non-existent books', async () => {
      OpenLib.getWork.mockRejectedValue(new Error('Work not found'));

      const response = await request(app)
        .get('/book/OL9999W')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Public vs Protected Routes', () => {
    it('should allow public access to book browsing', async () => {
      // No authentication needed
      await request(app)
        .get('/')
        .expect(200);

      await request(app)
        .get('/?query=javascript&limit=10&page=2')
        .expect(200);
    });

    it('should allow public access to book details', async () => {
      // No authentication needed
      await request(app)
        .get('/book/OL1234W')
        .expect(200);
    });

    it('should require authentication for book likes', async () => {
      await request(app)
        .post('/book/OL1234W/like')
        .expect(401);
    });

    it('should require authentication for user data', async () => {
      await request(app)
        .get('/user/1')
        .expect(401);

      await request(app)
        .get('/user/someone/bookshelf')
        .expect(401);
    });

    it('should require authentication for logout', async () => {
      await request(app)
        .post('/logout')
        .expect(401);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Register user
      await request(app)
        .post('/register')
        .send({
          email: 'consistent@example.com',
          password: 'password123',
          username: 'consistent'
        })
        .expect(201);

      // Verify user exists in database
      let user = await User.findOne({ where: { email: 'consistent@example.com' } });
      expect(user).not.toBeNull();
      const userId = user.id;

      // Login
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'consistent@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Like multiple books
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app)
        .post('/book/OL5678W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Verify books in database
      const books = await Book.findAll();
      expect(books.length).toBeGreaterThanOrEqual(2);

      // Verify likes in database
      const likes = await UserLike.findAll({ where: { userId } });
      expect(likes).toHaveLength(2);

      // Verify preferences in database
      const preferences = await UserPreference.findAll({ where: { userId } });
      expect(preferences.length).toBeGreaterThan(0);

      // Verify bookshelf matches database
      const bookshelfResponse = await request(app)
        .get('/user/consistent/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(bookshelfResponse.body.totalBooks).toBe(2);
    });
  });

  describe('Pagination and Search', () => {
    it('should handle pagination correctly', async () => {
      OpenLib.search.mockResolvedValue({
        numFound: 100,
        docs: Array(20).fill({
          key: '/works/OL1234W',
          title: 'Test Book',
          author_name: ['Author'],
          cover_i: 123
        })
      });

      // Page 1
      const page1 = await request(app)
        .get('/?limit=20&page=1')
        .expect(200);

      expect(page1.body.pagination.currentPage).toBe(1);
      expect(page1.body.pagination.totalPages).toBe(5);

      // Page 2
      const page2 = await request(app)
        .get('/?limit=20&page=2')
        .expect(200);

      expect(page2.body.pagination.currentPage).toBe(2);
    });

    it('should handle different search queries', async () => {
      await request(app)
        .get('/?query=javascript')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('javascript', 20, 1);

      await request(app)
        .get('/?query=python')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('python', 20, 1);
    });
  });
});
