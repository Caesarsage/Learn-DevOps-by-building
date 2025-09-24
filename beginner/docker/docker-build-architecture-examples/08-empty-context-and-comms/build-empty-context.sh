#!/usr/bin/env bash
set -euo pipefail
docker build -t hello-world-empty - <<'DOCKERFILE'
FROM alpine:latest
RUN echo "Hello, World!" > /hello.txt
CMD cat /hello.txt
DOCKERFILE
docker run --rm hello-world-empty
