# Architecture

The product is organized so the same reading product can ship as:

- H5 website on Vercel
- Android app with Expo / EAS
- iOS app with Expo / EAS

## Layers

- `src/types`: shared data shapes.
- `src/core`: pure product logic. This layer must not depend on React, browser APIs, native APIs, or server APIs.
- `src/services`: API clients used by app surfaces.
- `app`: Expo Router screens for Android, iOS, and future Expo Web.
- `public`: current Vercel H5 reader and private admin surface.
- `api`: Vercel Functions for public read and protected admin write APIs.
- `server`: shared API implementation and local preview server.
- `data`: seed books used locally and to initialize Blob storage.

## Runtime Model

The app always reads books through the same public API:

```txt
GET /books
```

Admin-only writes use authenticated APIs:

```txt
POST /books
PUT /books/:id
DELETE /books/:id
```

In production, these APIs run on Vercel and store book data in Vercel Blob.

## App API URL

Native builds cannot call `localhost` for production data. Set this before packaging:

```txt
EXPO_PUBLIC_API_URL=https://reading-app-sigma.vercel.app
```

After the custom domain is ready, change it to the final domain:

```txt
EXPO_PUBLIC_API_URL=https://read.example.com
```

## Migration Path

1. Keep `public` as the currently deployed H5/admin shell.
2. Move product logic into `src/core` and API access into `src/services`.
3. Make Expo screens match the H5 reader behavior.
4. When ready, build Expo Web and let Vercel serve that as the H5 experience.
5. Package Android and iOS from the same Expo app.
