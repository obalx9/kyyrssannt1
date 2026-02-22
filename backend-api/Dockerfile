FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
