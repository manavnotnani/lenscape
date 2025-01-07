FROM node:18-alpine AS build_image

# Install Python and build tools
RUN apk add --no-cache python3 py3-pip build-base

# Set Python symlink (node-gyp looks for 'python')
RUN ln -sf /usr/bin/python3 /usr/bin/python

RUN apk --no-cache add curl npm

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# install dependencies
RUN npm install

COPY . ./

# generate prisma
RUN npm db:generate

# build application
RUN npm build

# remove development dependencies
RUN npm install

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build_image /usr/src/app/dist ./dist
COPY --from=build_image /usr/src/app/node_modules ./node_modules
COPY --from=build_image /usr/src/app/prisma ./prisma

CMD ["/bin/sh", "-c", "npx prisma db push && node dist/main.js"]
