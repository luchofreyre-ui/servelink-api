FROM node:20-bookworm-slim

WORKDIR /app

# Copy full monorepo FIRST (critical)
COPY . .

# Move into API service
WORKDIR /app/services/api

# Install dependencies correctly
RUN npm ci

# Prisma needs a DATABASE_URL to generate
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generate Prisma client
RUN npx prisma generate

# Build API
RUN npm run build

# Remove dev deps
RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/main.js"]
