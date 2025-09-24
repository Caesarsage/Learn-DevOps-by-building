FROM node:18
WORKDIR /app
# This will fail if build context is ./projects/frontend because ../shared is outside
COPY ../shared/utils.js ./shared/utils.js
COPY src ./src
CMD ["node","-e","console.log('frontend build')"]
