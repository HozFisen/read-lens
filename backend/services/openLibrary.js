const axios = require('axios');

class OpenLib {
    /**
     * Search for books in OpenLibrary
     * @param {string} query - Search query (defaults to 'all' for general browsing)
     * @param {number} limit - Number of results per page
     * @param {number} page - Page number
     * @returns {Promise<Object>} Search results
     */
    static async search(query = 'all', limit = 20, page = 1) {
        try {
            const params = new URLSearchParams({
                q: query,
                fields: 'key,title,author_name,cover_i,first_publish_year',
                limit: limit.toString(),
                page: page.toString()
            });

            const response = await axios.get(
                `https://openlibrary.org/search.json?${params.toString()}`
            );
            return response.data;
        } catch (error) {
            throw new Error(`Failed to search OpenLibrary: ${error.message}`);
        }
    }

    /**
     * Get details of a specific work
     * @param {string} key - Work key (e.g., '/works/OL1099479W' or 'OL1099479W')
     * @returns {Promise<Object>} Work details
     */
    static async getWork(key) {
        try {
            // Normalize the key - add /works/ prefix if missing
            const normalizedKey = key.startsWith('/works/') 
                ? key 
                : `/works/${key}`;

            const response = await axios.get(
                `https://openlibrary.org${normalizedKey}.json`
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Work not found: ${key}`);
            }
            throw new Error(`Failed to fetch work: ${error.message}`);
        }
    }

    /**
     * Get cover image URL for a book
     * @param {string|number} coverId - Cover ID (from search results as 'cover_i')
     * @param {string} size - Size: 'S' (small), 'M' (medium), 'L' (large)
     * @returns {string|null} Cover image URL or null if no cover ID
     */
    static getCoverUrl(coverId, size = 'M') {
        if (!coverId) {
            return null;
        }
        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }
}

// Only run tests if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            console.log('Testing search...');
            const searchResults = await OpenLib.search('javascript', 5);
            console.log(`Found ${searchResults.numFound} results`);
            console.log('First result:', searchResults.docs[0]);

            console.log('\nTesting getWork...');
            const work = await OpenLib.getWork('OL1099479W');
            console.log('Work title:', work.subjects);

            console.log('\nTesting getCoverUrl...');
            if (searchResults.docs[0]?.cover_i) {
                const coverUrl = OpenLib.getCoverUrl(searchResults.docs[0].cover_i);
                console.log('Cover URL:', coverUrl);
            }
        } catch (error) {
            console.error('Test failed:', error.message);
        }
    })();
}

module.exports = OpenLib;