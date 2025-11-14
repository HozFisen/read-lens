# PRIMARY FEATURES
Display all kinds of books via OpenLibrary API (public)
Users can view details of a book request via OpenLibrary API

When liking a book it gets stored into a list of likes. Also helps display
If they're a user they get access to "My Liked Books"

Algorithm
Start with nothing

Once user like book. Get that book subjects and began to weigh how many words
Call back to phase 0!

We take frequecy of each subject/tags and make a new search query for a recommendation
store it in UserPreferences so we only need to call them once.

Fetch from URL using AXIOS
use process.env.[VARIABLE] to use Env.

[OpenLibrary](https://openlibrary.org) API EndPoints

/works/(OLID)
/subjects/(Subject)
/search?q=all


when using google authentication we need to use findOrCreate (sequelize) to find 