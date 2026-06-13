# Loomwood Website

A static application center and landing page for the Loomwood Minecraft server, ready for GitHub Pages. It includes Staff Application, Media Application, Voting, and Store options.

## Application forms

The Staff and Media forms use a Cloudflare Worker relay so Discord webhook URLs never appear in this public repository.

1. Create the Discord webhook(s) in the destination channel settings.
2. Sign in to Cloudflare: `npx wrangler login`
3. From the `worker` folder, add one shared webhook:
   `npx wrangler secret put DISCORD_WEBHOOK_URL`
4. Or use separate channels:
   `npx wrangler secret put STAFF_WEBHOOK_URL`
   `npx wrangler secret put MEDIA_WEBHOOK_URL`
5. Deploy from the `worker` folder: `npx wrangler deploy`
6. Copy the resulting `workers.dev` URL into `APPLICATION_API_URL` in `application.js`.
7. Commit and push that endpoint change.

Never place a Discord webhook URL in `application.js` or any other public website file.

The server address shown in the header is `play.loomwood.org`.

## Publish on GitHub Pages

1. Create a GitHub repository and upload these files.
2. Open the repository's **Settings**, then **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

GitHub will show the public site URL after deployment finishes.
