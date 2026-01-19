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
