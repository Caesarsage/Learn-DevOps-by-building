# Docker Build Architecture Examples

Code samples to accompany the article: **“Mastering Docker Build Contexts and Architecture”**.

**Article** :

This repo demonstrates common scenarios, best practices, and pitfalls of Docker builds.
Each folder contains its own `Dockerfile`, source files, and a `README.md` with usage instructions.

---

## 📂 Example Index

### 1. Local Directory Context
- **Folder:** [01-node-local-context](./01-node-local-context)
- **Description:** Node.js app using local build context, optimized with `.dockerignore` and proper layer caching.

### 2. Python Cache-Friendly Builds
- **Folder:** [02-python-cache](./02-python-cache)
- **Description:** Python app demonstrating dependency caching with `requirements.txt`.

### 3. Multi-Stage Builds
- **Folder:** [03-multistage-node](./03-multistage-node)
- **Description:** Node.js build stage → Nginx production stage for smaller images.

### 4. Wrong Context Directory
- **Folder:** [04-wrong-context](./04-wrong-context)
- **Description:** Example of incorrect context usage (`../shared` outside build context) and how to fix it.

### 5. `.dockerignore` Optimization
- **Folder:** [05-dockerignore-optimization](./05-dockerignore-optimization)
- **Description:** Shows the impact of ignoring large, unnecessary files for faster builds.

### 6. Build Secrets
- **Folder:** [06-build-secrets](./06-build-secrets)
- **Description:** Using BuildKit secrets (`--secret`) to keep API keys and sensitive data out of image layers.

### 7. Named Contexts
- **Folder:** [07-named-contexts](./07-named-contexts)
- **Description:** Demonstrates pulling in files from multiple named contexts.

### 8. Empty Context & Communication
- **Folder:** [08-empty-context-and-comms](./08-empty-context-and-comms)
- **Description:**
  - Empty context builds (`docker build - < Dockerfile`)
  - Stdin builds with args and labels
  - Bash + PowerShell scripts
  - Buildx ↔ BuildKit communication artifacts (Mermaid diagram, JSON request, resource requests)

---

## 🚀 Usage

Clone repo:
```bash
cd docker-build-architecture-examples
