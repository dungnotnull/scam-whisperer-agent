FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY dist/ ./dist/
COPY src/data/ ./src/data/
COPY src/ml/ ./src/ml/
COPY src/prompts/ ./src/prompts/

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
