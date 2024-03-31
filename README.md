<h1 align="center"> 
Vortex
</h1>

<p align="center">
  <img src="https://raw.githubusercontent.com/jarvis2f/vortex/main/public/logo-3d.png" alt="Vortex Logo" width="200" />
</p>

<p align="center">
    Vortex is a simple and fast web application. It is built with Next.js, Tailwind CSS, and Prisma.
</p>

<p align="center">
    <img src="https://github.com/jarvis2f/vortex/actions/workflows/docker-publish.yml/badge.svg" alt="Vortex Docker" />
    <img src="https://img.shields.io/github/package-json/v/jarvis2f/vortex" alt="Vortex Version" />
    <img src="https://codecov.io/gh/jarvis2f/vortex/graph/badge.svg?token=62ZZ6VYJUG" alt="Vortex codecov" />
    <img src="https://img.shields.io/github/license/jarvis2f/vortex" alt="Vortex License" />
</p>

<p align="center">
    <img src="https://raw.githubusercontent.com/jarvis2f/vortex/main/doc/dashboard.png" alt="Vortex Dashboard" width="90%"/>
</p>
<p align="center">
    <img src="https://raw.githubusercontent.com/jarvis2f/vortex/main/doc/server.png" alt="Vortex Umami" width="90%"/>
</p>

# Installation

## Docker Compose

1. Copy the [.env.example](.env.example) file to `.env` and fill in the environment variables.
2. Copy the [docker-compose.yml](docker%2Fdocker-compose.yml) file to the root of your project.
3. Copy the [redis.conf](docker%2Fredis.conf) file to the redis folder, and modify the password.

```bash
docker-compose up
```

### Optional Steps for umami

1. Copy the [docker-compose.umami.yml](docker%2Fdocker-compose.umami.yml) file to the root of your project.

```bash
docker-compose -f docker-compose.umami.yml up
```

### Backup and Restore PostgreSQL

```bash
docker exec -t vortex-postgres pg_dump -U postgres --data-only vortex > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```

```bash
cat dump.sql | docker exec -i vortex_postgres psql -U postgres -d vortex
```

## Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjarvis2f%2Fvortex)

# Development

## Prerequisites

- Node.js >= v20.8.1
- Yarn
- PostgreSQL
- Redis

## Getting Started

1. Install the dependencies.

```bash
npm install
```

2. Copy the [.env.example](.env.example) file to `.env` and fill in the environment variables.
3. Start the development server.

```bash
npm run dev
```

# License

Vortex is open source software [licensed as MIT](LICENSE).

# Acknowledgments

- [T3 Stack](https://create.t3.gg/)
- [Next.js](https://nextjs.org/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Umami](https://umami.is/)

> [!TIP]
> [Vortex Agent](https://github.com/jarvis2f/vortex-agent)
