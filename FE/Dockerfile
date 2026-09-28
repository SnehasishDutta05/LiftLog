FROM node:24-alpine AS build

WORKDIR /app

COPY FE/package*.json ./

RUN npm ci

COPY FE/ .

RUN npx ng build


FROM nginx:alpine

COPY --from=build /app/dist/pulseos-frontend/browser /usr/share/nginx/html

COPY FE/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
