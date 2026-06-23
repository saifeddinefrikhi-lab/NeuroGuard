FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server ./server
COPY test ./test

ENV NODE_ENV=production
ENV PORT=8084

EXPOSE 8084
CMD ["npm", "start"]
