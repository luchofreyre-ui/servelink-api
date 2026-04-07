FROM node:20-bookworm-slim

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

CMD ["node", "dist/main.js"]
