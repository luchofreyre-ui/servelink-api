FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

CMD ["node", "dist/main.js"]
