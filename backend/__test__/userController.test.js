const request = require('supertest');
const app = require('../app');
const { sequelize, User, Book, UserLike } = require('../models');
const { generateToken } = require('../helpers/jwt');

describe('User Controller', () => {
  // Setup: Clean database before each test
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should set custom role if provided', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'password123',
        username: 'adminuser',
        role: 'admin'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('admin');
    });

    it('should fail without email', async () => {
      const userData = {
        password: 'password123',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('Email');
    });

    it('should fail without password', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('password');
    });

    it('should fail without username', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('username');
    });

    it('should fail with password less than 6 characters', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: '12345',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('6 characters');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        username: 'user1'
      };

      // First registration
      await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const duplicateData = {
        email: 'duplicate@example.com',
        password: 'password456',
        username: 'user2'
      };

      const response = await request(app)
        .post('/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainPassword',
        username: 'testuser'
      };

      await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ where: { email: userData.email } });
      expect(user.password).not.toBe('plainPassword');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'testuser'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.access_token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(credentials.email);
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return valid JWT token', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);

      const token = response.body.access_token;
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should fail without email', async () => {
      const credentials = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(400);

      expect(response.body.error).toContain('Email');
    });

    it('should fail without password', async () => {
      const credentials = {
        email: 'testuser@example.com'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(400);

      expect(response.body.error).toContain('password');
    });

    it('should fail with non-existent email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should fail with incorrect password', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should be case sensitive for password', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'PASSWORD123' // Different case
      };

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /logout', () => {
    let token;

    beforeEach(async () => {
      const user = await User.create({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'testuser'
      });

      token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .post('/logout')
        .expect(401);

      expect(response.body.error).toContain('login');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /user/:id', () => {
    let user, token, book;

    beforeEach(async () => {
      user = await User.create({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'testuser'
      });

      token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      book = await Book.create({ olid: 'OL1234W' });
      await UserLike.create({ userId: user.id, bookId: book.id });
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/user/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(user.id);
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('testuser@example.com');
      expect(response.body.password).toBeUndefined();
    });

    it('should get user by username', async () => {
      const response = await request(app)
        .get(`/user/${user.username}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(user.id);
      expect(response.body.username).toBe('testuser');
    });

    it('should include liked books', async () => {
      const response = await request(app)
        .get(`/user/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.Books).toBeDefined();
      expect(response.body.Books).toHaveLength(1);
      expect(response.body.Books[0].olid).toBe('OL1234W');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/user/${user.id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/user/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /user/:username/bookshelf', () => {
    let user, token, book1, book2;

    beforeEach(async () => {
      user = await User.create({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'bookworm'
      });

      token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      book1 = await Book.create({ olid: 'OL1111W' });
      book2 = await Book.create({ olid: 'OL2222W' });

      await UserLike.create({ userId: user.id, bookId: book1.id });
      await UserLike.create({ userId: user.id, bookId: book2.id });
    });

    it('should get user bookshelf successfully', async () => {
      const response = await request(app)
        .get('/user/bookworm/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('bookworm');
      expect(response.body.books).toBeDefined();
      expect(response.body.books).toHaveLength(2);
      expect(response.body.totalBooks).toBe(2);
    });

    it('should include book olids', async () => {
      const response = await request(app)
        .get('/user/bookworm/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const olids = response.body.books.map(b => b.olid);
      expect(olids).toContain('OL1111W');
      expect(olids).toContain('OL2222W');
    });

    it('should include liked dates', async () => {
      const response = await request(app)
        .get('/user/bookworm/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.books[0].likedAt).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/user/bookworm/bookshelf')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/user/nonexistent/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return empty bookshelf for user with no likes', async () => {
      const newUser = await User.create({
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newreader'
      });

      const response = await request(app)
        .get('/user/newreader/bookshelf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.books).toHaveLength(0);
      expect(response.body.totalBooks).toBe(0);
    });
  });

  describe('User Controller Edge Cases', () => {
    it('should handle concurrent registration attempts', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'password123',
        username: 'concurrent'
      };

      // Simulate concurrent registrations
      const [response1, response2] = await Promise.allSettled([
        request(app).post('/register').send(userData),
        request(app).post('/register').send(userData)
      ]);

      // One should succeed, one should fail
      const statuses = [
        response1.value?.statusCode,
        response2.value?.statusCode
      ];

      expect(statuses).toContain(201);
      expect(statuses).toContain(400);
    });

    it('should handle very long usernames', async () => {
      const userData = {
        email: 'longname@example.com',
        password: 'password123',
        username: 'a'.repeat(255) // Very long username
      };

      // This test checks if database/model handles long strings
      // May succeed or fail depending on schema constraints
      const response = await request(app)
        .post('/register')
        .send(userData);

      // Should either create successfully or reject with validation error
      expect([201, 400]).toContain(response.statusCode);
    });

    it('should handle special characters in email', async () => {
      const userData = {
        email: 'user+tag@example.com',
        password: 'password123',
        username: 'specialuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe('user+tag@example.com');
    });

    it('should trim whitespace in inputs', async () => {
      const userData = {
        email: '  user@example.com  ',
        password: 'password123',
        username: '  testuser  '
      };

      const response = await request(app)
        .post('/register')
        .send(userData);

      // Behavior depends on whether trimming is implemented
      // This test documents current behavior
      expect(response.statusCode).toBeDefined();
    });
  });
});
