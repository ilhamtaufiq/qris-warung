FROM node:20-alpine AS builder

WORKDIR /app/mobile

ENV NODE_ENV=production
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY mobile/package.json mobile/package-lock.json ./
RUN npm ci

COPY mobile ./
RUN npm run build:web

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/mobile/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
