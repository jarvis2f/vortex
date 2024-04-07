FROM node:20-alpine3.18 AS base
FROM base AS deps

WORKDIR /app
COPY ./prisma ./
COPY ./package.json package-lock.json* ./
RUN npm install

FROM base AS builder
ARG DATABASE_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_ENV_VALIDATION 1
ENV NEXT_TELEMETRY_DISABLED 1
RUN SKIP_ENV_VALIDATION=1 npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm install -g prisma

COPY --from=builder /app/docker/docker-start.sh ./start.sh
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["sh", "start.sh"]
