# Stage 1: Build Angular application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx ng build --configuration=production

# Stage 2: Serve with lightweight nginx
FROM nginx:alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config to handle Angular routing (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
