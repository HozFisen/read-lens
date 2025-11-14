const request = require('supertest');
const app = require('../app');
const { sequelize, User, Book, UserLike, UserPreference } = require('../models');
const { generateToken } = require('../helpers/jwt');
const OpenLib = require('../services/openLibrary');
const geminiService = require('../services/gemini');

// Mock external services
jest.mock('../services/openLibrary');
jest.mock('../services/gemini');

describe('Book Controller', () => {
  // Setup: Clean database before each test
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    jest.clearAllMocks();
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET / (list books)', () => {
    beforeEach(() => {
      OpenLib.search.mockResolvedValue({
        numFound: 100,
        docs: [
          {
            key: '/works/OL1234W',
            title: 'Test Book 1',
            author_name: ['Author One'],
            cover_i: 12345,
            first_publish_year: 2020
          },
          {
            key: '/works/OL5678W',
            title: 'Test Book 2',
            author_name: ['Author Two'],
            cover_i: 67890,
            first_publish_year: 2021
          }
        ]
      });

      OpenLib.getCoverUrl.mockImplementation((coverId, size) => {
        return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
      });
    });

    it('should list books successfully with default parameters', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.books).toBeDefined();
      expect(response.body.books).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should format book data correctly', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      const book = response.body.books[0];
      expect(book.olid).toBe('OL1234W');
      expect(book.title).toBe('Test Book 1');
      expect(book.author).toBe('Author One');
      expect(book.authors).toEqual(['Author One']);
      expect(book.coverUrl).toBeDefined();
      expect(book.publishYear).toBe(2020);
    });

    it('should search with custom query', async () => {
      await request(app)
        .get('/?query=javascript')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('javascript', 20, 1);
    });

    it('should handle custom limit parameter', async () => {
      await request(app)
        .get('/?limit=10')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('all', 10, 1);
    });

    it('should handle custom page parameter', async () => {
      await request(app)
        .get('/?page=3')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('all', 20, 3);
    });

    it('should limit maximum results to 100', async () => {
      await request(app)
        .get('/?limit=500')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('all', 100, 1);
    });

    it('should enforce minimum limit of 1', async () => {
      await request(app)
        .get('/?limit=0')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('all', 1, 1);
    });

    it('should enforce minimum page of 1', async () => {
      await request(app)
        .get('/?page=0')
        .expect(200);

      expect(OpenLib.search).toHaveBeenCalledWith('all', 20, 1);
    });

    it('should calculate total pages correctly', async () => {
      const response = await request(app)
        .get('/?limit=20')
        .expect(200);

      expect(response.body.pagination.totalPages).toBe(5); // 100 / 20
    });

    it('should handle books without authors', async () => {
      OpenLib.search.mockResolvedValue({
        numFound: 1,
        docs: [
          {
            key: '/works/OL9999W',
            title: 'Unknown Author Book',
            cover_i: null,
            first_publish_year: 2020
          }
        ]
      });

      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.books[0].author).toBe('Unknown Author');
      expect(response.body.books[0].authors).toEqual([]);
    });

    it('should handle books without cover images', async () => {
      OpenLib.search.mockResolvedValue({
        numFound: 1,
        docs: [
          {
            key: '/works/OL9999W',
            title: 'No Cover Book',
            author_name: ['Test Author'],
            cover_i: null
          }
        ]
      });

      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.books[0].coverUrl).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      OpenLib.search.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /book/:id (book details)', () => {
    beforeEach(() => {
      OpenLib.getWork.mockResolvedValue({
        title: 'JavaScript: The Good Parts',
        description: 'A comprehensive guide to JavaScript programming',
        subjects: ['Programming', 'JavaScript', 'Computer Science'],
        covers: [12345],
        authors: [
          { author: { key: '/authors/OL123A' } }
        ],
        first_publish_date: '2008-05-01',
        links: []
      });

      OpenLib.getCoverUrl.mockImplementation((coverId, size) => {
        return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
      });
    });

    it('should get book details successfully', async () => {
      const response = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(response.body.olid).toBe('OL1234W');
      expect(response.body.title).toBe('JavaScript: The Good Parts');
      expect(response.body.description).toBeDefined();
      expect(response.body.subjects).toHaveLength(3);
      expect(response.body.coverUrl).toBeDefined();
    });

    it('should call OpenLibrary with correct work ID', async () => {
      await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(OpenLib.getWork).toHaveBeenCalledWith('OL1234W');
    });

    it('should handle description object', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        description: {
          type: '/type/text',
          value: 'Detailed description'
        },
        subjects: [],
        covers: []
      });

      const response = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(response.body.description).toBe('Detailed description');
    });

    it('should handle missing description', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: [],
        covers: []
      });

      const response = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(response.body.description).toBe('No description available');
    });

    it('should NOT generate AI summary by default', async () => {
      const response = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(response.body.aiSummary).toBeUndefined();
      expect(geminiService.summarizeBookDescription).not.toHaveBeenCalled();
    });

    it('should generate AI summary when requested', async () => {
      geminiService.summarizeBookDescription.mockResolvedValue(
        'AI-generated summary of the book'
      );

      const response = await request(app)
        .get('/book/OL1234W?summarize=true')
        .expect(200);

      expect(response.body.aiSummary).toBe('AI-generated summary of the book');
      expect(geminiService.summarizeBookDescription).toHaveBeenCalled();
    });

    it('should not generate AI summary for books without description', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: []
      });

      const response = await request(app)
        .get('/book/OL1234W?summarize=true')
        .expect(200);

      expect(response.body.aiSummary).toBeUndefined();
      expect(geminiService.summarizeBookDescription).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent book', async () => {
      OpenLib.getWork.mockRejectedValue(new Error('Work not found'));

      const response = await request(app)
        .get('/book/OL9999W')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle large cover size', async () => {
      const response = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(OpenLib.getCoverUrl).toHaveBeenCalledWith(12345, 'L');
    });

    it('should handle API errors', async () => {
      OpenLib.getWork.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/book/OL1234W')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /book/:id/like (like book)', () => {
    let user, token;

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

      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        description: 'A test book',
        subjects: ['Fiction', 'Adventure', 'Mystery']
      });
    });

    it('should like a book successfully', async () => {
      const response = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.message).toBe('Book liked successfully');
      expect(response.body.book.olid).toBe('OL1234W');
      expect(response.body.book.title).toBe('Test Book');
      expect(response.body.preferencesUpdated).toBe(3);
    });

    it('should create book in database if not exists', async () => {
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const book = await Book.findOne({ where: { olid: 'OL1234W' } });
      expect(book).not.toBeNull();
    });

    it('should create UserLike relationship', async () => {
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const book = await Book.findOne({ where: { olid: 'OL1234W' } });
      const like = await UserLike.findOne({
        where: { userId: user.id, bookId: book.id }
      });

      expect(like).not.toBeNull();
    });

    it('should update user preferences based on book subjects', async () => {
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences).toHaveLength(3);
      const subjects = preferences.map(p => p.subject);
      expect(subjects).toContain('fiction');
      expect(subjects).toContain('adventure');
      expect(subjects).toContain('mystery');
    });

    it('should increment existing preference weight', async () => {
      // First like with Fiction subject
      OpenLib.getWork.mockResolvedValue({
        title: 'Book 1',
        subjects: ['Fiction']
      });

      await request(app)
        .post('/book/OL1111W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Second like with Fiction subject
      OpenLib.getWork.mockResolvedValue({
        title: 'Book 2',
        subjects: ['Fiction']
      });

      await request(app)
        .post('/book/OL2222W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const preference = await UserPreference.findOne({
        where: { userId: user.id, subject: 'fiction' }
      });

      expect(preference.weight).toBe(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/book/OL1234W/like')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should prevent duplicate likes', async () => {
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

    it('should handle book not found in OpenLibrary', async () => {
      OpenLib.getWork.mockRejectedValue(new Error('Work not found'));

      const response = await request(app)
        .post('/book/OL9999W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle books without subjects', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        description: 'A test book'
      });

      const response = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.preferencesUpdated).toBe(0);

      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences).toHaveLength(0);
    });

    it('should handle empty subjects array', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: []
      });

      const response = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.preferencesUpdated).toBe(0);
    });

    it('should normalize subject case to lowercase', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: ['FICTION', 'Science Fiction', 'adventure']
      });

      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences.every(p => p.subject === p.subject.toLowerCase())).toBe(true);
    });

    it('should handle multiple users liking the same book', async () => {
      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        username: 'user2'
      });

      const token2 = generateToken({
        id: user2.id,
        email: user2.email,
        role: user2.role
      });

      // User 1 likes book
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // User 2 likes same book
      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token2}`)
        .expect(201);

      const book = await Book.findOne({ where: { olid: 'OL1234W' } });
      const likes = await UserLike.findAll({ where: { bookId: book.id } });

      expect(likes).toHaveLength(2);
    });
  });

  describe('BookController.setPreference (helper method)', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'testuser'
      });

      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: ['Fiction', 'Adventure']
      });
    });

    it('should create new preferences with weight 1', async () => {
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences).toHaveLength(2);
      expect(preferences.every(p => p.weight === 1)).toBe(true);
    });

    it('should skip empty subjects', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: ['Fiction', '', 'Adventure', '   ']
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      // Should only create preferences for non-empty subjects
      expect(preferences.length).toBeLessThanOrEqual(2);
    });

    it('should trim whitespace from subjects', async () => {
      OpenLib.getWork.mockResolvedValue({
        title: 'Test Book',
        subjects: ['  Fiction  ', 'Adventure   ']
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences.some(p => p.subject.includes(' '))).toBe(false);
    });
  });

  describe('Book Controller Integration', () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        email: 'reader@example.com',
        password: 'password123',
        username: 'booklover'
      });

      token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      OpenLib.search.mockResolvedValue({
        numFound: 50,
        docs: [
          {
            key: '/works/OL1234W',
            title: 'Fiction Book',
            author_name: ['Author'],
            cover_i: 123
          }
        ]
      });

      OpenLib.getWork.mockResolvedValue({
        title: 'Fiction Book',
        description: 'A great fiction book',
        subjects: ['Fiction', 'Drama']
      });

      OpenLib.getCoverUrl.mockReturnValue('http://cover.url/123.jpg');
    });

    it('should complete full book discovery and like flow', async () => {
      // 1. Search for books
      const searchResponse = await request(app)
        .get('/?query=fiction')
        .expect(200);

      expect(searchResponse.body.books).toHaveLength(1);

      // 2. Get book details
      const detailResponse = await request(app)
        .get('/book/OL1234W')
        .expect(200);

      expect(detailResponse.body.title).toBe('Fiction Book');

      // 3. Like the book
      const likeResponse = await request(app)
        .post('/book/OL1234W/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(likeResponse.body.message).toBe('Book liked successfully');

      // 4. Verify preferences were updated
      const preferences = await UserPreference.findAll({
        where: { userId: user.id }
      });

      expect(preferences.length).toBeGreaterThan(0);
    });
  });
});
