FROM node:18-alpine AS BUILD_IMAGE

RUN apk --no-cache add curl yarn

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

# install dependencies
RUN yarn install

COPY . ./

# generate prisma
RUN yarn db:generate

# build application
RUN yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /usr/src/app/prisma ./prisma

CMD ["/bin/sh", "-c", "npx prisma db push && node dist/main.js"]
