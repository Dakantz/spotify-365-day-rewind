FROM node:16 AS backend_base

ENV PORT 80

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm i -D
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY ./prisma ./prisma
COPY ./.env ./.env

RUN npm run generate-prisma

COPY . .

RUN npm run build

EXPOSE 80

FROM backend_base AS backend_api
CMD [ "node", "./build/api/server.js" ]

FROM backend_base AS backend_worker
CMD [ "node", "./build/worker/server.js" ]