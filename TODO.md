- [site and mobile] When logging, prefer to use the non-public profile for name. Ideally, also find private name.
- [site and mobile] When logging click, log what page it is coming from, and if possible, what person it is related to in this page
- Enable adding images (as data URLs, or upload to server - see https://github.com/quilljs/quill/issues/1089)
- Fix strange client errors on old browsers (recreated on Android emulator browser)
- Add "delete reason" in delete dialog
- Enable linking to anchors in page (which will also be cited in links preview)
- Consider switching to working with redis - https://app.redislabs.com/#/subscriptions/subscription/1670090/bdb-view/10835436/configuration
     or maybe with Vercel-KV - https://vercel.com/docs/storage/vercel-kv
- Show last change date (Which should be a link that opens a History window)

- Add "Copy" button next to phone numbers
- Show icon for each result (and enable defining icons for pages/categories)
- [mobile]: Find how to make site links open the app on Android
- Show auto-complete dropdown for in-phonebook links in editor
- Highlight search in result page
- Add Kosher/Mehadrin info to food places
- Enable customization/themes
- Link unlinked e-mail addresses (check if there are any)
- Set a nightly backup of the data (to a private GitHub gist?)
- Handle cross-domain authentication
- Data sanitation:
    * Verify no page contains link to https://sites.google.com/site/yeruchamphonebook
    * verify social network links use relative images
- X Think of how to handle deletion (also so the flutter app can be updated about changes)
- X Handle page history
- Consider moving to preact (https://justinnoel.dev/2020/05/12/using-preact-in-a-next-js-project/)
- Consider moving to tailwind.css / svelte+sapper / shoelace
