# 🧳 Packwise

**Smart packing lists for every trip.**

Packwise is a full-stack web application that helps travelers create intelligent, organized packing lists for any trip. Built with Next.js 14 App Router, Supabase, Prisma, and Tailwind CSS.

## Features

- 💻 **Dashboard** – View and manage all your trips in one place
- ➕ **Create Trips** – Set up trips with destination, dates, and trip type
- 🤖 **Smart Suggestions** – AI-powered starter packing list based on trip type
- ✅ **Interactive Packing** – Check off items as you pack with real-time progress
- 📝 **Custom Items** – Add your own items to any category
- 📊 **Progress Tracking** – Visual progress bar showing packing completion
- 🔒 **Auth** – Secure login/signup powered by Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Project Structure

```
packwise/
├── actions/           # Next.js Server Actions
│   ├── trip.actions.ts  # CRUD for trips
│   └── packing.actions.ts # Item management
├── app/               # Next.js App Router pages
│   ├── (auth)/login/    # Authentication page
│   ├── auth/callback/   # OAuth callback
│   ├── dashboard/       # User dashboard
│   └── trip/[id]/       # Trip detail page
├── components/        # React components
├── lib/               # Shared utilities
│   ├── supabase/        # Supabase client
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Helper functions
├── prisma/            # Database schema & migrations
├── types/             # TypeScript types
└── utils/             # Packing list generators
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- PostgreSQL database

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/mvng/packwise.git
cd packwise
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up the database**

```bash
npx prisma db push
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mvng/packwise)

Make sure to set all environment variables in your Vercel project settings.

## License

MIT
