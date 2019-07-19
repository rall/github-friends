# github-friends
A useful Ionic app for finding new friends (or perhaps searching for enemies) on GitHub.

Ok, so this is a coding test. Here's what's what:

The pagination UI is very weird indeed: using a form input for selecting a page number and number of items per page. I had inteded to use infinite scrolling but that wasn't going to work with the rate limit on unauthentiucated searches with the REST API.

It would be nice if a new search reset the page count to 1, and also if the number of pages was displayed (a straightforward calculation as we know the total count and the number per page)
