Build (with BuildKit):
  DOCKER_BUILDKIT=1 docker build --secret id=apikey,src=./apikey.txt .
