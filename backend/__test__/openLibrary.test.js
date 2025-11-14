const OpenLib = require('../services/openLibrary');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('OpenLibrary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search for books successfully', async () => {
      const mockResponse = {
        data: {
          numFound: 100,
          docs: [
            {
              key: '/works/OL1234W',
              title: 'Test Book',
              author_name: ['Test Author'],
              cover_i: 12345,
              first_publish_year: 2020
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await OpenLib.search('javascript', 20, 1);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://openlibrary.org/search.json')
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.numFound).toBe(100);
      expect(result.docs).toHaveLength(1);
    });

    it('should use default parameters when not provided', async () => {
      const mockResponse = {
        data: {
          numFound: 50,
          docs: []
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await OpenLib.search();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('q=all')
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      );
    });

    it('should handle custom query parameters', async () => {
      const mockResponse = {
        data: {
          numFound: 25,
          docs: []
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await OpenLib.search('python programming', 10, 2);

      const call = axios.get.mock.calls[0][0];
      expect(call).toContain('q=python+programming');
      expect(call).toContain('limit=10');
      expect(call).toContain('page=2');
    });

    it('should include correct fields in search request', async () => {
      const mockResponse = {
        data: { numFound: 0, docs: [] }
      };

      axios.get.mockResolvedValue(mockResponse);

      await OpenLib.search('test', 20, 1);

      const call = axios.get.mock.calls[0][0];
      expect(call).toContain('fields=key,title,author_name,cover_i,first_publish_year');
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(OpenLib.search('test')).rejects.toThrow(
        'Failed to search OpenLibrary: Network error'
      );
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          numFound: 0,
          docs: []
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await OpenLib.search('nonexistentbook12345');

      expect(result.numFound).toBe(0);
      expect(result.docs).toEqual([]);
    });
  });

  describe('getWork', () => {
    it('should fetch work details successfully with full key', async () => {
      const mockResponse = {
        data: {
          title: 'Test Book',
          description: 'A test book description',
          subjects: ['Fiction', 'Adventure'],
          covers: [12345],
          authors: [{ author: { key: '/authors/OL123A' } }],
          first_publish_date: '2020'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await OpenLib.getWork('/works/OL1234W');

      expect(axios.get).toHaveBeenCalledWith(
        'https://openlibrary.org/works/OL1234W.json'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should normalize work key without /works/ prefix', async () => {
      const mockResponse = {
        data: {
          title: 'Test Book'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await OpenLib.getWork('OL1234W');

      expect(axios.get).toHaveBeenCalledWith(
        'https://openlibrary.org/works/OL1234W.json'
      );
    });

    it('should handle work not found error', async () => {
      const error = new Error('Request failed');
      error.response = { status: 404 };
      axios.get.mockRejectedValue(error);

      await expect(OpenLib.getWork('OL9999W')).rejects.toThrow(
        'Work not found: OL9999W'
      );
    });

    it('should handle other API errors', async () => {
      const error = new Error('Server error');
      error.response = { status: 500 };
      axios.get.mockRejectedValue(error);

      await expect(OpenLib.getWork('OL1234W')).rejects.toThrow(
        'Failed to fetch work: Server error'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network timeout');
      axios.get.mockRejectedValue(error);

      await expect(OpenLib.getWork('OL1234W')).rejects.toThrow(
        'Failed to fetch work: Network timeout'
      );
    });

    it('should handle work with description object', async () => {
      const mockResponse = {
        data: {
          title: 'Test Book',
          description: {
            type: '/type/text',
            value: 'Detailed description'
          }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await OpenLib.getWork('OL1234W');

      expect(result.description.value).toBe('Detailed description');
    });

    it('should handle work with no covers', async () => {
      const mockResponse = {
        data: {
          title: 'Test Book',
          covers: null
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await OpenLib.getWork('OL1234W');

      expect(result.covers).toBeNull();
    });
  });

  describe('getCoverUrl', () => {
    it('should generate cover URL with default size', () => {
      const url = OpenLib.getCoverUrl(12345);

      expect(url).toBe('https://covers.openlibrary.org/b/id/12345-M.jpg');
    });

    it('should generate cover URL with small size', () => {
      const url = OpenLib.getCoverUrl(12345, 'S');

      expect(url).toBe('https://covers.openlibrary.org/b/id/12345-S.jpg');
    });

    it('should generate cover URL with medium size', () => {
      const url = OpenLib.getCoverUrl(12345, 'M');

      expect(url).toBe('https://covers.openlibrary.org/b/id/12345-M.jpg');
    });

    it('should generate cover URL with large size', () => {
      const url = OpenLib.getCoverUrl(12345, 'L');

      expect(url).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
    });

    it('should return null for null cover ID', () => {
      const url = OpenLib.getCoverUrl(null);

      expect(url).toBeNull();
    });

    it('should return null for undefined cover ID', () => {
      const url = OpenLib.getCoverUrl(undefined);

      expect(url).toBeNull();
    });

    it('should return null for empty string cover ID', () => {
      const url = OpenLib.getCoverUrl('');

      expect(url).toBeNull();
    });

    it('should handle numeric cover ID', () => {
      const url = OpenLib.getCoverUrl(98765, 'L');

      expect(url).toBe('https://covers.openlibrary.org/b/id/98765-L.jpg');
    });

    it('should handle string cover ID', () => {
      const url = OpenLib.getCoverUrl('12345', 'M');

      expect(url).toBe('https://covers.openlibrary.org/b/id/12345-M.jpg');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete book search and detail flow', async () => {
      // Mock search response
      const searchResponse = {
        data: {
          numFound: 1,
          docs: [
            {
              key: '/works/OL1234W',
              title: 'JavaScript: The Good Parts',
              author_name: ['Douglas Crockford'],
              cover_i: 12345,
              first_publish_year: 2008
            }
          ]
        }
      };

      // Mock work detail response
      const workResponse = {
        data: {
          title: 'JavaScript: The Good Parts',
          description: 'A comprehensive guide to JavaScript',
          subjects: ['Programming', 'JavaScript'],
          covers: [12345],
          authors: [{ author: { key: '/authors/OL123A' } }],
          first_publish_date: '2008-05-01'
        }
      };

      axios.get
        .mockResolvedValueOnce(searchResponse)
        .mockResolvedValueOnce(workResponse);

      // Search for book
      const searchResults = await OpenLib.search('javascript good parts');
      expect(searchResults.docs).toHaveLength(1);

      const bookKey = searchResults.docs[0].key.replace('/works/', '');

      // Get book details
      const workDetails = await OpenLib.getWork(bookKey);
      expect(workDetails.title).toBe('JavaScript: The Good Parts');

      // Get cover URL
      const coverUrl = OpenLib.getCoverUrl(searchResults.docs[0].cover_i, 'L');
      expect(coverUrl).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
    });

    it('should handle pagination in search', async () => {
      const mockResponse = {
        data: {
          numFound: 100,
          docs: Array(20).fill({
            key: '/works/OL1234W',
            title: 'Test Book',
            author_name: ['Author'],
            cover_i: 123,
            first_publish_year: 2020
          })
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // Get first page
      const page1 = await OpenLib.search('test', 20, 1);
      expect(page1.docs).toHaveLength(20);

      // Get second page
      const page2 = await OpenLib.search('test', 20, 2);
      expect(page2.docs).toHaveLength(20);

      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
