# Build with: docker build --build-context docs=./documentation .
FROM alpine
WORKDIR /app
COPY . /app
RUN --mount=from=docs,target=/docs \
    cp /docs/manual.pdf /app/manual.pdf && \
    echo "Copied /docs/manual.pdf into image"
CMD ["sh","-lc","ls -al /app"]
