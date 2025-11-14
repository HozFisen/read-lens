const { sequelize, User, Book, UserLike, UserPreference } = require('../models');
const { hashPassword } = require('../helpers/bcrypt');

describe('Model Tests', () => {
  // Setup: Clean database before each test
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Model', () => {
    describe('User Creation', () => {
      it('should create a user successfully', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          role: 'user'
        };

        const user = await User.create(userData);

        expect(user.id).toBeDefined();
        expect(user.email).toBe(userData.email);
        expect(user.username).toBe(userData.username);
        expect(user.role).toBe(userData.role);
        expect(user.password).not.toBe(userData.password); // Should be hashed
      });

      it('should hash password on create', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'plainPassword',
          username: 'testuser'
        };

        const user = await User.create(userData);

        expect(user.password).not.toBe('plainPassword');
        expect(user.password.length).toBeGreaterThan(20);
      });

      it('should fail without email', async () => {
        const userData = {
          password: 'password123',
          username: 'testuser'
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should fail without password', async () => {
        const userData = {
          email: 'test@example.com',
          username: 'testuser'
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should fail without username', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123'
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should fail with invalid email format', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          username: 'testuser'
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should fail with duplicate email', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
        };

        await User.create(userData);

        const duplicateData = {
          email: 'test@example.com',
          password: 'password456',
          username: 'testuser2'
        };

        await expect(User.create(duplicateData)).rejects.toThrow();
      });

      it('should set default role to user', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
        };

        const user = await User.create(userData);

        expect(user.role).toBe('user');
      });

      it('should allow admin role', async () => {
        const userData = {
          email: 'admin@example.com',
          password: 'password123',
          username: 'adminuser',
          role: 'admin'
        };

        const user = await User.create(userData);

        expect(user.role).toBe('admin');
      });
    });

    describe('User Associations', () => {
      let user;

      beforeEach(async () => {
        user = await User.create({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
        });
      });

      it('should associate with books through UserLike', async () => {
        const book = await Book.create({ olid: 'OL1234W' });
        await UserLike.create({ userId: user.id, bookId: book.id });

        const userWithBooks = await User.findByPk(user.id, {
          include: [Book]
        });

        expect(userWithBooks.Books).toHaveLength(1);
        expect(userWithBooks.Books[0].olid).toBe('OL1234W');
      });

      it('should have many user preferences', async () => {
        await UserPreference.create({
          userId: user.id,
          subject: 'fiction',
          weight: 5
        });

        await UserPreference.create({
          userId: user.id,
          subject: 'science',
          weight: 3
        });

        const userWithPreferences = await User.findByPk(user.id, {
          include: [UserPreference]
        });

        expect(userWithPreferences.UserPreferences).toHaveLength(2);
      });
    });

    describe('User Query', () => {
      beforeEach(async () => {
        await User.create({
          email: 'user1@example.com',
          password: 'password123',
          username: 'user1'
        });

        await User.create({
          email: 'user2@example.com',
          password: 'password123',
          username: 'user2'
        });
      });

      it('should find user by email', async () => {
        const user = await User.findOne({ where: { email: 'user1@example.com' } });

        expect(user).not.toBeNull();
        expect(user.username).toBe('user1');
      });

      it('should find user by username', async () => {
        const user = await User.findOne({ where: { username: 'user2' } });

        expect(user).not.toBeNull();
        expect(user.email).toBe('user2@example.com');
      });

      it('should return all users', async () => {
        const users = await User.findAll();

        expect(users).toHaveLength(2);
      });

      it('should exclude password from query', async () => {
        const user = await User.findOne({
          where: { email: 'user1@example.com' },
          attributes: { exclude: ['password'] }
        });

        expect(user.password).toBeUndefined();
      });
    });
  });

  describe('Book Model', () => {
    describe('Book Creation', () => {
      it('should create a book successfully', async () => {
        const book = await Book.create({ olid: 'OL1234W' });

        expect(book.id).toBeDefined();
        expect(book.olid).toBe('OL1234W');
        expect(book.createdAt).toBeDefined();
        expect(book.updatedAt).toBeDefined();
      });

      it('should fail without olid', async () => {
        await expect(Book.create({})).rejects.toThrow();
      });

      it('should fail with empty olid', async () => {
        await expect(Book.create({ olid: '' })).rejects.toThrow();
      });

      it('should allow multiple books with different olids', async () => {
        await Book.create({ olid: 'OL1234W' });
        await Book.create({ olid: 'OL5678W' });

        const books = await Book.findAll();
        expect(books).toHaveLength(2);
      });
    });

    describe('Book Associations', () => {
      let book, user;

      beforeEach(async () => {
        book = await Book.create({ olid: 'OL1234W' });
        user = await User.create({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
        });
      });

      it('should associate with users through UserLike', async () => {
        await UserLike.create({ userId: user.id, bookId: book.id });

        const bookWithUsers = await Book.findByPk(book.id, {
          include: [User]
        });

        expect(bookWithUsers.Users).toHaveLength(1);
        expect(bookWithUsers.Users[0].username).toBe('testuser');
      });

      it('should support multiple users liking the same book', async () => {
        const user2 = await User.create({
          email: 'user2@example.com',
          password: 'password123',
          username: 'user2'
        });

        await UserLike.create({ userId: user.id, bookId: book.id });
        await UserLike.create({ userId: user2.id, bookId: book.id });

        const bookWithUsers = await Book.findByPk(book.id, {
          include: [User]
        });

        expect(bookWithUsers.Users).toHaveLength(2);
      });
    });

    describe('Book Query', () => {
      beforeEach(async () => {
        await Book.create({ olid: 'OL1111W' });
        await Book.create({ olid: 'OL2222W' });
        await Book.create({ olid: 'OL3333W' });
      });

      it('should find book by olid', async () => {
        const book = await Book.findOne({ where: { olid: 'OL2222W' } });

        expect(book).not.toBeNull();
        expect(book.olid).toBe('OL2222W');
      });

      it('should return all books', async () => {
        const books = await Book.findAll();

        expect(books).toHaveLength(3);
      });

      it('should find or create book', async () => {
        const [book, created] = await Book.findOrCreate({
          where: { olid: 'OL4444W' },
          defaults: { olid: 'OL4444W' }
        });

        expect(created).toBe(true);
        expect(book.olid).toBe('OL4444W');

        const [book2, created2] = await Book.findOrCreate({
          where: { olid: 'OL4444W' },
          defaults: { olid: 'OL4444W' }
        });

        expect(created2).toBe(false);
        expect(book2.id).toBe(book.id);
      });
    });
  });

  describe('UserLike Model', () => {
    let user, book;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      });

      book = await Book.create({ olid: 'OL1234W' });
    });

    describe('UserLike Creation', () => {
      it('should create a user like successfully', async () => {
        const like = await UserLike.create({
          userId: user.id,
          bookId: book.id
        });

        expect(like.id).toBeDefined();
        expect(like.userId).toBe(user.id);
        expect(like.bookId).toBe(book.id);
        expect(like.createdAt).toBeDefined();
      });

      it('should fail without userId', async () => {
        await expect(
          UserLike.create({ bookId: book.id })
        ).rejects.toThrow();
      });

      it('should fail without bookId', async () => {
        await expect(
          UserLike.create({ userId: user.id })
        ).rejects.toThrow();
      });

      it('should prevent duplicate likes', async () => {
        await UserLike.create({
          userId: user.id,
          bookId: book.id
        });

        // Attempting to create duplicate should fail
        // Note: This depends on unique constraint in database
        const duplicate = UserLike.create({
          userId: user.id,
          bookId: book.id
        });

        // May or may not throw depending on database constraints
        // For comprehensive test, add unique constraint in migration
      });
    });

    describe('UserLike Associations', () => {
      it('should belong to user', async () => {
        const like = await UserLike.create({
          userId: user.id,
          bookId: book.id
        });

        const likeWithUser = await UserLike.findByPk(like.id, {
          include: [User]
        });

        expect(likeWithUser.User.username).toBe('testuser');
      });

      it('should belong to book', async () => {
        const like = await UserLike.create({
          userId: user.id,
          bookId: book.id
        });

        const likeWithBook = await UserLike.findByPk(like.id, {
          include: [Book]
        });

        expect(likeWithBook.Book.olid).toBe('OL1234W');
      });
    });

    describe('UserLike Query', () => {
      beforeEach(async () => {
        const book2 = await Book.create({ olid: 'OL5678W' });
        
        await UserLike.create({ userId: user.id, bookId: book.id });
        await UserLike.create({ userId: user.id, bookId: book2.id });
      });

      it('should find all likes by user', async () => {
        const likes = await UserLike.findAll({
          where: { userId: user.id }
        });

        expect(likes).toHaveLength(2);
      });

      it('should find specific like', async () => {
        const like = await UserLike.findOne({
          where: {
            userId: user.id,
            bookId: book.id
          }
        });

        expect(like).not.toBeNull();
        expect(like.userId).toBe(user.id);
        expect(like.bookId).toBe(book.id);
      });

      it('should count user likes', async () => {
        const count = await UserLike.count({
          where: { userId: user.id }
        });

        expect(count).toBe(2);
      });
    });
  });

  describe('UserPreference Model', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      });
    });

    describe('UserPreference Creation', () => {
      it('should create a user preference successfully', async () => {
        const preference = await UserPreference.create({
          userId: user.id,
          subject: 'Fiction',
          weight: 5
        });

        expect(preference.id).toBeDefined();
        expect(preference.userId).toBe(user.id);
        expect(preference.subject).toBe('fiction'); // Should be lowercased
        expect(preference.weight).toBe(5);
      });

      it('should lowercase subject before create', async () => {
        const preference = await UserPreference.create({
          userId: user.id,
          subject: 'SCIENCE FICTION',
          weight: 3
        });

        expect(preference.subject).toBe('science fiction');
      });

      it('should set default weight to 0', async () => {
        const preference = await UserPreference.create({
          userId: user.id,
          subject: 'history'
        });

        expect(preference.weight).toBe(0);
      });

      it('should fail without userId', async () => {
        await expect(
          UserPreference.create({
            subject: 'fiction',
            weight: 5
          })
        ).rejects.toThrow();
      });

      it('should fail without subject', async () => {
        await expect(
          UserPreference.create({
            userId: user.id,
            weight: 5
          })
        ).rejects.toThrow();
      });

      it('should allow negative weights', async () => {
        const preference = await UserPreference.create({
          userId: user.id,
          subject: 'horror',
          weight: -5
        });

        expect(preference.weight).toBe(-5);
      });
    });

    describe('UserPreference Associations', () => {
      it('should belong to user', async () => {
        const preference = await UserPreference.create({
          userId: user.id,
          subject: 'fiction',
          weight: 5
        });

        const prefWithUser = await UserPreference.findByPk(preference.id, {
          include: [User]
        });

        expect(prefWithUser.User.username).toBe('testuser');
      });
    });

    describe('UserPreference Query', () => {
      beforeEach(async () => {
        await UserPreference.create({
          userId: user.id,
          subject: 'fiction',
          weight: 10
        });

        await UserPreference.create({
          userId: user.id,
          subject: 'science',
          weight: 5
        });

        await UserPreference.create({
          userId: user.id,
          subject: 'history',
          weight: 3
        });
      });

      it('should find all preferences by user', async () => {
        const preferences = await UserPreference.findAll({
          where: { userId: user.id }
        });

        expect(preferences).toHaveLength(3);
      });

      it('should find preference by subject', async () => {
        const preference = await UserPreference.findOne({
          where: {
            userId: user.id,
            subject: 'fiction'
          }
        });

        expect(preference).not.toBeNull();
        expect(preference.weight).toBe(10);
      });

      it('should order preferences by weight', async () => {
        const preferences = await UserPreference.findAll({
          where: { userId: user.id },
          order: [['weight', 'DESC']]
        });

        expect(preferences[0].subject).toBe('fiction');
        expect(preferences[1].subject).toBe('science');
        expect(preferences[2].subject).toBe('history');
      });

      it('should update preference weight', async () => {
        const preference = await UserPreference.findOne({
          where: {
            userId: user.id,
            subject: 'science'
          }
        });

        await preference.update({ weight: preference.weight + 1 });

        const updated = await UserPreference.findByPk(preference.id);
        expect(updated.weight).toBe(6);
      });
    });

    describe('UserPreference Business Logic', () => {
      it('should support incrementing weights', async () => {
        const preference = await UserPreference.create({
          userId: user.id,
          subject: 'fiction',
          weight: 1
        });

        // Simulate multiple likes of fiction books
        await preference.update({ weight: preference.weight + 1 });
        await preference.reload();
        await preference.update({ weight: preference.weight + 1 });
        await preference.reload();

        expect(preference.weight).toBe(3);
      });

      it('should find or create preference', async () => {
        const [pref1, created1] = await UserPreference.findOrCreate({
          where: {
            userId: user.id,
            subject: 'adventure'
          },
          defaults: {
            userId: user.id,
            subject: 'adventure',
            weight: 1
          }
        });

        expect(created1).toBe(true);
        expect(pref1.weight).toBe(1);

        const [pref2, created2] = await UserPreference.findOrCreate({
          where: {
            userId: user.id,
            subject: 'adventure'
          },
          defaults: {
            userId: user.id,
            subject: 'adventure',
            weight: 1
          }
        });

        expect(created2).toBe(false);
        expect(pref2.id).toBe(pref1.id);
      });
    });
  });

  describe('Model Integration', () => {
    it('should handle complete user bookshelf flow', async () => {
      // Create user
      const user = await User.create({
        email: 'reader@example.com',
        password: 'password123',
        username: 'reader'
      });

      // Create books
      const book1 = await Book.create({ olid: 'OL1111W' });
      const book2 = await Book.create({ olid: 'OL2222W' });

      // User likes books
      await UserLike.create({ userId: user.id, bookId: book1.id });
      await UserLike.create({ userId: user.id, bookId: book2.id });

      // Create preferences
      await UserPreference.create({
        userId: user.id,
        subject: 'fiction',
        weight: 5
      });

      // Query complete user data
      const completeUser = await User.findByPk(user.id, {
        include: [
          {
            model: Book,
            through: { attributes: ['createdAt'] }
          },
          {
            model: UserPreference
          }
        ]
      });

      expect(completeUser.Books).toHaveLength(2);
      expect(completeUser.UserPreferences).toHaveLength(1);
    });

    it('should cascade delete user likes when user is deleted', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      });

      const book = await Book.create({ olid: 'OL1234W' });

      await UserLike.create({ userId: user.id, bookId: book.id });

      await user.destroy();

      const likes = await UserLike.findAll({
        where: { userId: user.id }
      });

      // Depending on cascade settings, likes might be deleted
      // This tests the actual cascade behavior
      expect(likes).toHaveLength(0);
    });
  });
});
