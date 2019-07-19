# Github Friends
A useful Ionic app for finding new friends (or perhaps searching for enemies) on GitHub.

Ok, so this is a coding test. Here's what's what:

The pagination UI is very weird indeed: using a form input for selecting a page number and number of items per page. I had inteded to use infinite scrolling but that wasn't going to work with the rate limit on unauthentiucated searches with the REST API.

It would be nice if a new search reset the page count to 1, and also if the number of pages was displayed (a straightforward calculation as we know the total count and the number per page)

Some other features I was planning:

 - Show the text match data with search results: there's a toggle to request that data (it sets a header) but I didn't write the component to display matches with search results
 - An http interceptor to cache responses
 - Another http interceptor to display a spinner when a search is active
 - Some e2e tests!
 - There's an `incomplete_results` field in the response data that isn't represented in the UI
