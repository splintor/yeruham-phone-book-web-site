In order to clone this repo and build your own phonebook, follow these steps:

## Clone GitHub repository
1. You probably have a GitHub account, but if not, go to https://github.com/signup and create one.
1. After you logged in with your account, open https://github.com/splintor/yeruham-phone-book-web-site
1. Click **Fork** (on the top right of the GitHub page) - you now have a new repo for your phonebook site!
1. You need the repo to have a proper name - go to the **Settings** tab, and use a different name, like `my-group-phone-book-web-site`, then click **Rename**.

## Customize site
1. The site was initially built for Yeruham phonebook. You need to customize it to show the details of you and your group.
2. In your site repo (on github.com), drill down to see the content of the `README.md` file and click the *pencil* icon and edit it to describe the project of your site, then click `Commit changes`.
3. In your site repo (on github.com), go to `site-info.json` and click the *pencil* icon to edit the file, then click `Commit changes`.
4. Change the fields there to match the data of your site.
5. Go to the `public` directory, and then click the `+` button and upload logo files to be used in the site, and then click `Commit changes`. You will need these files:
   1. `favicon.ico` (will be used in the browser tab icon)
   2. `logo192.png` (will be used in the Safari browser tab icon)
   3. `logo-square.jpg` (will be used in WhatsApp preview)
   4. `logo.png` (will be used in the site)

## Create Wix site
1. The phonebook data is stored in a Wix site. If you don't have a Wix account, create one at https://users.wix.com/signin. The easiest way is to use your Google account.
2. Go to https://wix.new - this will create a new Wix site in edit mode.
3. Click **Dev Mode** and then **Turn on Dev Mode**. The site code editor will open.
4. Click on the `{}` icon on the left to move to **Code Files**
5. Click the `+` button in the **Backend** section and select **New .js File**.
6. A new file is created. Name it `http-functions.js`.
7. Go to the [wix-site-code/http-functions.js](wix-site-code/http-functions.js) in your repo, and copy its content to the clipboard.
8. In the Wix site editor, select your new `http-functions.js` file. It is opened in the lower code panel on the right. Select its content and replace it with the content you copied.
9. Repeat items 5-8 for the files `crypt.js`, `hebrewMapping.js` and `secret.js`.
10. In the Wix editor, select **Settings** and then **Business Info**.
11. In the opened **Dashboard** window, select **Website settings**.
12. Choose a name for your Wix site (this name will only be seen by you), e.g. `My Group Phonebook`.
13. Set a clear **Site address (URL)**, e.g. `my-group-phonebook`.
14. Click **Save** and then close the **Dashboard** window.
15. Refresh the page to make the Wix editor get the changes you did in the Dashboard.
16. Select the **Databases** section, then click the **+** icon next to **Content Collections** and select **New Collection**.
17. In the opened dialog, click **Start Creating** if needed, then set the name of the new collection to `pages`.
18. Switch to **Additional Settings** tab and in the **Set permissions for your collection** field, select **Custom Use**.
19. Click **Set Custom Permissions** and set all four permissions to **Anyone**.
20. Click **Set & Create Collection**.
21. Repeat steps 16-20 to create `pages_history` collection.
22. Click **Publish** (in the top-right corner).
23. **Copy the site URL** that appears in the publishing results message (you will need it in the next section - **Deploy to Vercel**), then click **Done**.
24. In the **Edit Your Site for Mobile** message, click **Cancel**, then you can close the Wix editor.

## Deploy to Vercel
1. To host your phonebook website, we use Vercel. If you don't already have an account there, go to https://vercel.com/signup and create one. The easiest way to do it is to use your GitHub account.
1. Go to https://github.com/apps/vercel/installations/new/permissions?target_id=93447819 and click **Install** to install Vercel on your GitHub account. You can select if you want it on all of your GitHub repositories, or only the phonebook website repository.
1. Open https://vercel.com/new and Click **Import** to import your phonebook website repository to Vercel.
1. You can create a team if you want. If not, just click **Skip**.
1. In the **Configure Project** section, expand the **Environment Variables** area.
1. Add a new variable:
    * Name: `WIX_PAGE_URL` 
    * Value: the URL of the Wix site you copied in the previous step
    Then click **Add**.
1. Click **Deploy**.

## Add data
1. Your new site is created. Now you need to customize it for your group. Click **Go to Dashboard**.
2. Open your new site. By default, your site is located at the URL `https://<Github project name>.vercel.app. If you want a different URL, you will need to purchase a domain. See https://vercel.com/docs/concepts/projects/custom-domains.
3. In the login window, type your phone number and click **כניסה**. Since the database is still empty, you will be loggedin succesfully with any phone number, and your name will be **כניסה ראשונית**.
4. Click the **menu icon** at the top-left, and select **הוספת דף חדש**
5. Fill in your name in the title, and a text that contains your phone number in the body and click **שמירה**.
Note: Make sure you put the correct phone number, as you will later use it to login to the system.
6. Now you can start adding the pages for all the other members of the group. Note that once you entered a page for a member, this member can login to the site and add other members as well.
7. Add a page titled 'הסבר על השימוש באתר'. This is the page that will be displayed when opening the site's help.

TODO: Enable customizing the site and explain how to do it.

