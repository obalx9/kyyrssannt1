FROM node:24-slim

WORKDIR /app

COPY package*.json ./
COPY backend-api/package*.json ./backend-api/

RUN npm ci --omit=dev
RUN cd backend-api && npm ci --omit=dev

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "backend-api/index.js"]
