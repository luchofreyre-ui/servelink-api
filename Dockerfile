# API image: Node + npm guaranteed. Builds services/api (includes system-test-intelligence via npm script).
#
# Railway: service root = repo root. Use Dockerfile builder (not a raw shell build with no Node).
# Clear custom Build Command, or leave empty so Docker build uses this file.
# Start Command: node dist/main.js  (Railway often sets cwd to /app/services/api when using this image;
# if not, use:  sh -c "cd services/api && node dist/main.js"  only if your platform runs from /app.)

FROM node:20-bookworm-slim
WORKDIR /app

COPY packages/system-test-intelligence ./packages/system-test-intelligence
COPY services/api ./services/api

WORKDIR /app/services/api
RUN npm ci
# Prisma needs a syntactically valid URL at generate time (no live DB required).
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
