# Tractor Games

A web application for playing the popular trick-taking card game Tractor, deployed on Vercel.

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Design playground

All colours, type, card sizes, radii and shadows are CSS custom properties in
`app/tokens.css`. To see and edit them live, run the frontend alone (no Convex
needed) and open `/playground`. If you have no `.env.local` yet, copy the
example first; its placeholder URL is enough for the playground.

```bash
cp -n .env.local.example .env.local
```

```bash
npm run dev:frontend
```

Then go to [http://localhost:3000/playground](http://localhost:3000/playground).
The left panel edits tokens; the right side shows every card, hand, trick
area, score widget, lobby, room and game board (from fixture data) at phone
and desktop width. **Save** writes your edits back to `app/tokens.css`, so
they show up in `git diff` like any other change. The playground and its save
endpoint exist only under `next dev`; production returns 404.

### Deployment

This project is configured for immediate deployment on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy your project

No additional configuration needed!

## Features

- Welcome page with name input (max 6 characters)
- Name storage tied to IP address
- Ready for Convex backend integration (currently using in-memory storage)

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Vercel (deployment platform)
