- Productize: Enable customizing logo and about text.
- Productize: Make site accessible if no pages exists (for initial bootstrap)
- Logs - add number next to name in all log messages
- Enable adding images (as data URLs)
- Fix strange client errors on old browsers (recreated on Android emulator browser)
- App: Facebook icons are not displayed
- Fix Showing Edit/Remove buttons in mobile web. Appears when editing item in list view.
- App: Log app actions
- When only one categoty is found - open it (חשמלאים)
- Add "delete reason" in delete dialog
- Don't go back when deleting an item in results list
- Handle מנצפך in search


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
