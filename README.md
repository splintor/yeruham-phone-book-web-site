## ספר הטלפונים של ירוחם - אתר האינטרנט 

A [next.js](https://nextjs.org/) site to provide access to Yeruham Phone book data.

We store the data on a [Wix site data collection](https://www.wix.com/corvid/feature/database)
with [services](./wix-site-code) to access the data.
The actual Wix code is stored on the site and [duplicated here](./wix-site-code) to make it open and to track changes.

### Things left to be done:
1. TODO: Style page editor
1. TODO: Consider moving to preact (https://justinnoel.dev/2020/05/12/using-preact-in-a-next-js-project/)
1. TODO: Consider moving to tailwind.css / svelte+sapper / shoelace
1. TODO: Add help link to login page
1. TODO: Improve editing features (bold, underline, link, social media icons)
1. TODO: Find how to make site links open the app on Android
1. TODO: Add "Copy" button next to phone numbers
1. TODO: Show icon for each result (and enable defining icons for pages/categories)
1. TODO: Add documentation and link to it from home
1. TODO: Enable showing all tags
1. TODO: Highlight search in result page
1. TODO: Handle cross-domain authentication
1. TODO: Verify no page contains link to https://sites.google.com/site/yeruchamphonebook
1. TODO: X Think of how to handle deletion (also so the flutter app can be updated about changes)
1. TODO: X Handle page history


### Benefits in new sites
1. It won't close on 2021
1. It has nicer URLs
1. It is designed exactly as I want it
1. It enables logging in based on phone number existance
1. It enables tagging pages
1. It enables making page with specific tag public
1. It enables control on how page link looks on WhatsApp previews
1. It enables easy Telegram integration (notify on change/access/search)
1. It won't send me e-mails when I edit pages
1. It can provide easy editing on mobile devices

