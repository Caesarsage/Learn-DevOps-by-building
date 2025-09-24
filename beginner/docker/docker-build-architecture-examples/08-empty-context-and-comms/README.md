
```mermaid
sequenceDiagram
    participant You
    participant Buildx as Buildx (Client)
    participant BuildKit as BuildKit (Server)
    participant Registry
    You->>Buildx: docker build .
    Buildx->>BuildKit: Send build request
    Note over BuildKit: - Dockerfile<br/>- Build args<br/>- Export options<br/>- Cache options
    BuildKit->>Buildx: Request: "I need package.json"
    Buildx->>BuildKit: Send package.json
    BuildKit->>BuildKit: Execute: RUN npm install
    BuildKit->>Buildx: Request: "I need src/ directory"
    Buildx->>BuildKit: Send src/ files
    BuildKit->>BuildKit: Execute: COPY src/ ./src/
    BuildKit->>Buildx: Build complete
    Buildx->>You: Show build results
    Note over BuildKit,Registry: Optional: Push to registry

```


Build request example:
{
  "dockerfile": "FROM node:18\\nWORKDIR /app\\n...",
  "buildArgs": {"NODE_ENV": "production"},
  "exportOptions": {"type": "image", "name": "my-app:latest"},
  "cacheOptions": {"type": "registry", "ref": "my-app:cache"}
}
