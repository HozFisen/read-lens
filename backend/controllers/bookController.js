const OpenLib = require('../services/openLibrary');
const geminiService = require('../services/gemini');
const { Book, UserLike, UserPreference, User } = require('../models');

class BookController {
  /**
   * PUBLIC: Get list of books with pagination
   * GET /
   */
  static async list(req, res, next) {
    try {
      const { query = 'all', limit = 20, page = 1 } = req.query;

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const validPage = Math.max(parseInt(page) || 1, 1);

      // Fetch from OpenLibrary API
      const results = await OpenLib.search(query, validLimit, validPage);

      // Format response with cover URLs
      const books = results.docs.map(book => ({
        olid: book.key?.replace('/works/', ''),
        title: book.title,
        author: book.author_name?.[0] || 'Unknown Author',
        authors: book.author_name || [],
        coverUrl: OpenLib.getCoverUrl(book.cover_i, 'M'),
        publishYear: book.first_publish_year
      }));

      res.status(200).json({
        books,
        pagination: {
          currentPage: validPage,
          limit: validLimit,
          totalResults: results.numFound,
          totalPages: Math.ceil(results.numFound / validLimit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLIC: Get detailed information about a specific book
   * GET /book/:id
   */
  static async detail(req, res, next) {
    try {
      const { id } = req.params;
      const { summarize } = req.query; // Optional: ?summarize=true

      if (!id) {
        throw { name: 'ValidationError', message: 'Book ID is required' };
      }

      // Fetch work details from OpenLibrary
      const work = await OpenLib.getWork(id);

      // Extract cover ID from covers array if available
      const coverId = work.covers?.[0];

      // Get original description
      const originalDescription = typeof work.description === 'object' 
        ? work.description.value 
        : work.description || 'No description available';

      // Generate AI summary if requested and description exists
      let aiSummary = null;
      if (summarize === 'true' && originalDescription !== 'No description available') {
        aiSummary = await geminiService.summarizeBookDescription(
          originalDescription,
          work.title,
          work.subjects || []
        );
      }

      // Format response
      const bookDetail = {
        olid: id,
        title: work.title,
        description: originalDescription,
        ...(aiSummary && { aiSummary }), // Include AI summary only if generated
        subjects: work.subjects || [],
        authors: work.authors?.map(author => ({
          key: author.author?.key,
          name: author.author?.key // Will need separate call for name if needed
        })) || [],
        coverUrl: OpenLib.getCoverUrl(coverId, 'L'),
        firstPublishDate: work.first_publish_date,
        links: work.links || []
      };

      res.status(200).json(bookDetail);
    } catch (error) {
      if (error.message.includes('not found')) {
        error.name = 'NotFound';
        error.message = 'Book not found';
      }
      next(error);
    }
  }

  /**
   * PROTECTED: Like a book and update user preferences
   * POST /book/:id/like
   */
  static async like(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id) {
        throw { name: 'ValidationError', message: 'Book ID is required' };
      }

      // Fetch book details from OpenLibrary to get subjects
      const work = await OpenLib.getWork(id);

      if (!work) {
        throw { name: 'NotFound', message: 'Book not found in OpenLibrary' };
      }

      // Find or create book in database
      const [book, created] = await Book.findOrCreate({
        where: { olid: id },
        defaults: { olid: id }
      });

      // Check if user already liked this book
      const existingLike = await UserLike.findOne({
        where: {
          userId: userId,
          bookId: book.id
        }
      });

      if (existingLike) {
        throw { name: 'DuplicateError', message: 'You have already liked this book' };
      }

      // Create the like relationship
      await UserLike.create({
        userId: userId,
        bookId: book.id
      });

      // Update user preferences based on book subjects
      if (work.subjects && work.subjects.length > 0) {
        await BookController.setPreference(userId, work.subjects);
      }

      res.status(201).json({
        message: 'Book liked successfully',
        book: {
          olid: id,
          title: work.title
        },
        preferencesUpdated: work.subjects?.length || 0
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        error.name = 'NotFound';
        error.message = 'Book not found';
      }
      next(error);
    }
  }

  /**
   * HELPER: Update user preferences based on book subjects
   * @param {number} userId - User ID
   * @param {Array<string>} subjects - Array of subject strings
   */
  static async setPreference(userId, subjects) {
    try {
      if (!Array.isArray(subjects) || subjects.length === 0) {
        return;
      }

      // Process each subject
      for (const subject of subjects) {
        // Skip empty or invalid subjects
        if (!subject || typeof subject !== 'string') {
          continue;
        }

        // Normalize subject (trim and lowercase for consistency)
        const normalizedSubject = subject.trim();

        if (normalizedSubject.length === 0) {
          continue;
        }

        // Find existing preference
        const existingPreference = await UserPreference.findOne({
          where: {
            userId: userId,
            subject: normalizedSubject
          }
        });

        if (existingPreference) {
          // Increment weight if preference exists
          await existingPreference.update({
            weight: existingPreference.weight + 1
          });
        } else {
          // Create new preference with weight 1
          await UserPreference.create({
            userId: userId,
            subject: normalizedSubject,
            weight: 1
          });
        }
      }
    } catch (error) {
      // Log error but don't throw - preference update shouldn't block the like action
      console.error('Error updating preferences:', error);
    }
  }
}

module.exports = BookController;