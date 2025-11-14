const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found. AI summarization will be disabled.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  /**
   * Generate a concise summary of a book description
   * @param {string} description - Book description to summarize
   * @param {string} title - Book title for context
   * @param {Array<string>} subjects - Book subjects for context
   * @returns {Promise<string|null>} Summary or null if failed
   */
  async summarizeBookDescription(description, title = '', subjects = []) {
    try {
      // Check if Gemini is available
      if (!this.genAI) {
        return null;
      }

      // Skip if description is too short
      if (!description || description.length < 100) {
        return null;
      }

      // Initialize the model
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Create context-aware prompt
      const subjectsContext = subjects.length > 0 
        ? `The book covers topics like: ${subjects.slice(0, 5).join(', ')}.` 
        : '';

      const prompt = `You are a book curator helping readers understand books quickly. 
      
Book Title: "${title}"
${subjectsContext}

Description:
${description}

Task: Create a clear, engaging 2-3 sentence summary that captures the essence of this book. Focus on what makes it interesting and who might enjoy it. Be concise and inviting.`;

      // Generate summary
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return summary.trim();
    } catch (error) {
      console.error('Gemini summarization error:', error.message);
      return null;
    }
  }

  /**
   * Generate book recommendations based on subjects
   * @param {Array<string>} subjects - Array of subject interests
   * @returns {Promise<string|null>} Recommendation text or null
   */
  async generateRecommendationInsight(subjects) {
    try {
      if (!this.genAI || !subjects || subjects.length === 0) {
        return null;
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `Based on someone interested in these topics: ${subjects.slice(0, 10).join(', ')}.

Provide a brief 1-2 sentence insight about their reading interests and what kinds of books they might explore next.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Gemini recommendation error:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new GeminiService();