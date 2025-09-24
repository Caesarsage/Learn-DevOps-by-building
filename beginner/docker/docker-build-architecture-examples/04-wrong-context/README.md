Wrong:
  # from ./04-wrong-context
  docker build projects/frontend
Fix options:
  1) cd projects/frontend && docker build .
  2) docker build -f projects/frontend/Dockerfile .
  3) Restructure repo so needed files are inside the chosen context.
