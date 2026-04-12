# API image: Node + npm guaranteed. Builds services/api (includes system-test-intelligence via npm script).
#
# Railway: service root = repo root. Use Dockerfile builder (not a raw shell build with no Node).
# Clear custom Build Command, or leave empty so Docker build uses this file.
# Start Command: npm --prefix services/api run start  (WORKDIR is /app; prefix resolves to /app/services/api)

FROM node:20-bookworm-slim
WORKDIR /app

COPY packages/system-test-intelligence ./packages/system-test-intelligence
COPY services/api ./services/api

RUN npm ci --prefix services/api
# Prisma needs a syntactically valid URL at generate time (no live DB required).
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN npx --prefix services/api prisma generate
RUN npm run build --prefix services/api
RUN npm prune --omit=dev --prefix services/api

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "services/api/dist/main.js"]
