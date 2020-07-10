FROM node:12 as base
ENV NODE_ENVIRONMENT=""

FROM nginx:1.15-alpine as app-base
ENV NODE_ENVIRONMENT=""

FROM base as src
WORKDIR /home/app

COPY package.json /home/app/
COPY package-lock.json / home/app/
RUN npm install
COPY . /home/app
RUN npm run build


FROM app-base as app-release
COPY nginx.conf /etc/nginx
COPY --from=src /home/app/build /usr/share/nginx/html
EXPOSE 4000