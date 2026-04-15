# This Dockerfile REQUIRES Railway Root Directory to be EMPTY (repo root) and Dockerfile path
# set to: services/api/Dockerfile
# If Root Directory remains services/api, this build will FAIL. Do not attempt to work around that.

FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY packages/system-test-intelligence ./packages/system-test-intelligence

COPY services/api/package*.json ./services/api/
WORKDIR /workspace/services/api
RUN npm install

COPY services/api/ ./

ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
