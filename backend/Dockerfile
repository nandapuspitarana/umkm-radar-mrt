FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build TS
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
