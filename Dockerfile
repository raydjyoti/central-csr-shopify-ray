FROM node:18-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
ARG APP_MODE=production
ENV APP_MODE=$APP_MODE
EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install
RUN cd frontend && npm install && npm run build
CMD ["sh", "-c", "if [ \"$APP_MODE\" = \"development\" ]; then (cd frontend && npm run dev &) && npm run dev; else npm run serve; fi"]
