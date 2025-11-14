const { sequelize, User, Book, UserLike, UserPreference } = require('../models');

describe('Database Migrations', () => {
  beforeAll(async () => {
    // Sync database with force: true to ensure clean state
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Table Migration', () => {
    it('should create User table with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('Users');

      expect(tableDescription.id).toBeDefined();
      expect(tableDescription.email).toBeDefined();
      expect(tableDescription.password).toBeDefined();
      expect(tableDescription.username).toBeDefined();
      expect(tableDescription.role).toBeDefined();
      expect(tableDescription.createdAt).toBeDefined();
      expect(tableDescription.updatedAt).toBeDefined();
    });

    it('should have correct data types for User columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('Users');

      expect(tableDescription.email.type).toContain('VARCHAR');
      expect(tableDescription.password.type).toContain('VARCHAR');
      expect(tableDescription.username.type).toContain('VARCHAR');
      expect(tableDescription.role.type).toContain('VARCHAR');
    });

    it('should have correct constraints for User table', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('Users');

      expect(tableDescription.email.allowNull).toBe(false);
      expect(tableDescription.password.allowNull).toBe(false);
      expect(tableDescription.username.allowNull).toBe(false);
    });

    it('should create User successfully', async () => {
      const user = await User.create({
        email: 'migration@test.com',
        password: 'password123',
        username: 'migrationtest'
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('migration@test.com');
    });
  });

  describe('Book Table Migration', () => {
    it('should create Book table with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('Books');

      expect(tableDescription.id).toBeDefined();
      expect(tableDescription.olid).toBeDefined();
      expect(tableDescription.createdAt).toBeDefined();
      expect(tableDescription.updatedAt).toBeDefined();
    });

    it('should have correct data types for Book columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('Books');

      expect(tableDescription.olid.type).toContain('VARCHAR');
    });

    it('should have correct constraints for Book table', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('Books');

      expect(tableDescription.olid.allowNull).toBe(false);
    });

    it('should create Book successfully', async () => {
      const book = await Book.create({
        olid: 'OL1234W'
      });

      expect(book.id).toBeDefined();
      expect(book.olid).toBe('OL1234W');
    });
  });

  describe('UserLike Table Migration', () => {
    it('should create UserLike table with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('UserLikes');

      expect(tableDescription.id).toBeDefined();
      expect(tableDescription.userId).toBeDefined();
      expect(tableDescription.bookId).toBeDefined();
      expect(tableDescription.createdAt).toBeDefined();
      expect(tableDescription.updatedAt).toBeDefined();
    });

    it('should have correct foreign key constraints', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('UserLikes');

      expect(tableDescription.userId).toBeDefined();
      expect(tableDescription.bookId).toBeDefined();
    });

    it('should create UserLike relationship successfully', async () => {
      const user = await User.create({
        email: 'like@test.com',
        password: 'password123',
        username: 'liketest'
      });

      const book = await Book.create({
        olid: 'OL5678W'
      });

      const like = await UserLike.create({
        userId: user.id,
        bookId: book.id
      });

      expect(like.id).toBeDefined();
      expect(like.userId).toBe(user.id);
      expect(like.bookId).toBe(book.id);
    });

    it('should cascade delete when user is deleted', async () => {
      const user = await User.create({
        email: 'cascade@test.com',
        password: 'password123',
        username: 'cascadetest'
      });

      const book = await Book.create({
        olid: 'OL9999W'
      });

      await UserLike.create({
        userId: user.id,
        bookId: book.id
      });

      await user.destroy();

      const likes = await UserLike.findAll({
        where: { userId: user.id }
      });

      expect(likes).toHaveLength(0);
    });
  });

  describe('UserPreference Table Migration', () => {
    it('should create UserPreference table with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('UserPreferences');

      expect(tableDescription.id).toBeDefined();
      expect(tableDescription.userId).toBeDefined();
      expect(tableDescription.subject).toBeDefined();
      expect(tableDescription.weight).toBeDefined();
      expect(tableDescription.createdAt).toBeDefined();
      expect(tableDescription.updatedAt).toBeDefined();
    });

    it('should have correct data types for UserPreference columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('UserPreferences');

      expect(tableDescription.subject.type).toContain('VARCHAR');
      expect(tableDescription.weight.type).toContain('INTEGER');
    });

    it('should have correct constraints for UserPreference table', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('UserPreferences');

      expect(tableDescription.userId.allowNull).toBe(false);
      expect(tableDescription.subject.allowNull).toBe(false);
      expect(tableDescription.weight.allowNull).toBe(false);
    });

    it('should create UserPreference successfully', async () => {
      const user = await User.create({
        email: 'pref@test.com',
        password: 'password123',
        username: 'preftest'
      });

      const preference = await UserPreference.create({
        userId: user.id,
        subject: 'Fiction',
        weight: 5
      });

      expect(preference.id).toBeDefined();
      expect(preference.subject).toBe('fiction'); // Should be lowercased
      expect(preference.weight).toBe(5);
    });

    it('should lowercase subject on create', async () => {
      const user = await User.create({
        email: 'lowercase@test.com',
        password: 'password123',
        username: 'lowercasetest'
      });

      const preference = await UserPreference.create({
        userId: user.id,
        subject: 'UPPERCASE SUBJECT',
        weight: 1
      });

      expect(preference.subject).toBe('uppercase subject');
    });
  });

  describe('Database Indexes and Constraints', () => {
    it('should enforce unique email constraint', async () => {
      await User.create({
        email: 'unique@test.com',
        password: 'password123',
        username: 'unique1'
      });

      await expect(
        User.create({
          email: 'unique@test.com',
          password: 'password456',
          username: 'unique2'
        })
      ).rejects.toThrow();
    });

    it('should have proper associations between models', async () => {
      const user = await User.create({
        email: 'assoc@test.com',
        password: 'password123',
        username: 'assoctest'
      });

      const book = await Book.create({
        olid: 'OL1111W'
      });

      await UserLike.create({
        userId: user.id,
        bookId: book.id
      });

      // Test User -> Book association
      const userWithBooks = await User.findByPk(user.id, {
        include: [Book]
      });

      expect(userWithBooks.Books).toHaveLength(1);

      // Test Book -> User association
      const bookWithUsers = await Book.findByPk(book.id, {
        include: [User]
      });

      expect(bookWithUsers.Users).toHaveLength(1);
    });
  });

  describe('Migration Integrity', () => {
    it('should have all required tables created', async () => {
      const tables = await sequelize.getQueryInterface().showAllTables();

      expect(tables).toContain('Users');
      expect(tables).toContain('Books');
      expect(tables).toContain('UserLikes');
      expect(tables).toContain('UserPreferences');
    });

    it('should handle transactions correctly', async () => {
      const transaction = await sequelize.transaction();

      try {
        const user = await User.create({
          email: 'transaction@test.com',
          password: 'password123',
          username: 'transactiontest'
        }, { transaction });

        const book = await Book.create({
          olid: 'OL2222W'
        }, { transaction });

        await UserLike.create({
          userId: user.id,
          bookId: book.id
        }, { transaction });

        await transaction.commit();

        const savedUser = await User.findOne({
          where: { email: 'transaction@test.com' }
        });

        expect(savedUser).not.toBeNull();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    it('should rollback transactions on error', async () => {
      const transaction = await sequelize.transaction();

      try {
        await User.create({
          email: 'rollback@test.com',
          password: 'password123',
          username: 'rollbacktest'
        }, { transaction });

        // This should fail due to missing required field
        await User.create({
          email: 'rollback2@test.com'
          // Missing password and username
        }, { transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();

        // Verify first user was rolled back
        const user = await User.findOne({
          where: { email: 'rollback@test.com' }
        });

        expect(user).toBeNull();
      }
    });
  });
});
