FROM node:24-alpine

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
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["node", "backend-api/index.js"]
