# Requires BuildKit
# docker build --secret id=apikey,src=./apikey.txt .
FROM alpine
RUN --mount=type=secret,id=apikey \
    sh -lc 'echo "Using secret:" && cat /run/secrets/apikey | wc -c'
CMD ["sh","-lc","echo Runtime has no secret file"]
