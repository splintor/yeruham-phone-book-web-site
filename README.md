## ספר הטלפונים של ירוחם - אתר האינטרנט 

A [next.js](https://nextjs.org/) site to provide access to Yeruham Phone book data.

We store the data on a [Wix site data collection](https://www.wix.com/corvid/feature/database)
with [services](./wix-site-code) to access the data.
The actual Wix code is stored on the site and [duplicated here](./wix-site-code) to make it open and to track changes.

### Things left to be done:
1. TODO: Enable passing "preview=false" in URL and use it in Telegram links so it doesn't show preview on every update.
1. TOD: Try to upgrade to next v10
1. TODO: Update page URL when updating the page title.
1. TODO: Make sure update and createt fail when title conflicts with the title of existing/deleted page 
1. TODO: Consider moving to tailwind.css / svelte
1. TODO: Add "Copy" button next to phone numbers
1. TODO: Show icon for each result (and enable defining icons for pages/categories)
1. TODO: Improve editing features (bold, underline, link, social media icons)
1. TODO: Add documentation and link to it from home
1. TODO: Enable showing all tags
1. TODO: Send mail on change (https://github.com/kpdecker/jsdiff)
1. TODO: Highlight search in result page
1. TODO: Handle cross-domain authentication
1. TODO: Verify no page contains link to https://sites.google.com/site/yeruchamphonebook
1. TODO: X Think of how to handle deletion (also so the flutter app can be updated about changes)
1. TODO: X Handle page history
