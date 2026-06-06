# Deployment

This project is ready to deploy on Vercel:

- Public reader app: `/`
- Private admin app: `/admin`
- Public read API: `GET /books`
- Protected write API: `POST /books`, `PUT /books/:id`, `DELETE /books/:id`
- Persistent book storage: Vercel Blob

## Vercel Environment Variables

Set these in Vercel project settings:

```sh
ADMIN_USERNAME=your-admin-name
ADMIN_PASSWORD=your-long-private-password
ADMIN_SESSION_SECRET=your-random-secret
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
BOOKS_BLOB_PATH=data/books.json
EXPO_PUBLIC_API_URL=https://reading-app-sigma.vercel.app
```

Use a strong value for `ADMIN_SESSION_SECRET`. It is used to sign the admin login cookie.

## Vercel Setup

1. Import this GitHub repository into Vercel.
2. Add a Vercel Blob store to the project.
3. Add the environment variables above.
4. Deploy.
5. In Vercel Domains, add your subdomain, such as `read.example.com`.
6. In your DNS provider, point that subdomain to Vercel as instructed by Vercel.

After deploy:

- Public app: `https://your-subdomain.example.com`
- Admin app: `https://your-subdomain.example.com/admin`

For Android/iOS builds, update `EXPO_PUBLIC_API_URL` to the same production domain before packaging.

## Local Development

The local preview still uses `data/books.json` unless `BLOB_READ_WRITE_TOKEN` is set.

```sh
npm run preview
```

Optional local file path:

```sh
DATA_PATH=/data/books.json
```

Use `DATA_PATH` only when the hosting provider gives you a persistent disk. Without persistent storage, edits saved in the admin may disappear after a redeploy or container restart.
