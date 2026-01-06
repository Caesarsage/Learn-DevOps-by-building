# Contributing Guide

Thank you for your interest in contributing to **Learn DevOps by Building**! 🎉

This project aims to help people learn DevOps through hands-on projects. Every contribution helps someone on their DevOps journey.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Project Structure](#project-structure)
- [Adding a New Project](#adding-a-new-project)
- [Style Guide](#style-guide)
- [Pull Request Process](#pull-request-process)
- [Recognition](#recognition)

## 📜 Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

## 🤝 How Can I Contribute?

### 🐛 Report Bugs

Found something broken? Open an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### 💡 Suggest Projects

Have an idea for a new DevOps project? We'd love to hear it!
- Open an issue with the `project-idea` label
- Describe the learning objectives
- Suggest difficulty level (beginner/intermediate/advanced)

### 📝 Improve Documentation

- Fix typos or unclear instructions
- Add missing steps
- Translate documentation
- Add diagrams or screenshots

### 🛠️ Submit New Projects

See [Adding a New Project](#adding-a-new-project) below.

## 📁 Project Structure

```
Learn-DevOps-by-building/
├── README.md                 # Main awesome list
├── CONTRIBUTING.md           # This file
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
│
├── beginner/                 # Entry-level projects
│   ├── linux/
│   ├── docker/
│   ├── terraform/
│   ├── bash/
│   └── ansible/
│
├── intermediate/             # More challenging projects
│   ├── aws/
│   ├── azure/
│   ├── k8/
│   ├── ansible/
│   ├── security/
│   └── ngnix/
│
└── advanced/                 # Expert-level projects
    ├── terraform/
    ├── kubernetes/
    ├── docker/
    ├── aws/
    └── networking/
```

## ➕ Adding a New Project

### 1. Choose the Right Location

| Difficulty | Criteria |
|------------|----------|
| **Beginner** | Single tool, basic concepts, < 1 hour to complete |
| **Intermediate** | Multiple tools, integration concepts, 1-4 hours |
| **Advanced** | Complex architecture, production patterns, 4+ hours |

### 2. Create Project Folder

```bash
# Example: Adding a new intermediate Kubernetes project
mkdir -p intermediate/k8/my-new-project
```

### 3. Required Files

Every project MUST have:

```
my-new-project/
├── README.md           # Main documentation (REQUIRED)
├── assets/             # Screenshots, diagrams
│   └── architecture.png
└── [project files]     # Code, manifests, configs
```

### 4. README Template

Use this template for consistency:

```markdown
# Project Title

Brief description (1-2 sentences)

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Step-by-Step Guide](#step-by-step-guide)
- [Troubleshooting](#troubleshooting)
- [Key Learnings](#key-learnings)

## Overview

### What You'll Build
Describe the end result.

### What You'll Learn
- Learning objective 1
- Learning objective 2
- Learning objective 3

### Technologies Used
| Technology | Version | Purpose |
|------------|---------|---------|
| Tool 1     | x.x.x   | Why it's used |

## Prerequisites

- [ ] Prerequisite 1
- [ ] Prerequisite 2

## Architecture

![Architecture Diagram](./assets/architecture.png)

## Getting Started

```bash
# Quick start commands
```

## Step-by-Step Guide

### Step 1: Title
Detailed instructions...

### Step 2: Title
Detailed instructions...

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Issue 1 | Fix 1    |

## Key Learnings

✅ What you learned
✅ Best practices covered
✅ Common pitfalls avoided

## Next Steps

Suggestions for further learning.

---
*Author: [Your Name](https://github.com/yourusername)*
```

### 5. Update Main README

Add your project to the appropriate section in the root `README.md`:

```markdown
| [Project Name](./path/to/project/README.md) | Brief description | `Tech1` `Tech2` |
```

## 🎨 Style Guide

### Documentation

- Use **Markdown** for all documentation
- Include a **Table of Contents** for long docs
- Add **screenshots** for visual steps
- Use **code blocks** with language hints
- Include **architecture diagrams** where helpful

### Code

- Follow **best practices** for each tool
- Add **comments** explaining why, not what
- Include **error handling**
- Provide **working examples**

### Naming Conventions

- Folders: `kebab-case` (e.g., `multi-tier-app`)
- Files: `kebab-case` or `snake_case`
- Avoid spaces and special characters

### Commit Messages

```
type: brief description

- Detail 1
- Detail 2

Closes #issue_number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`

## 🔄 Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/my-new-project
   ```
3. **Make** your changes
4. **Test** everything works
5. **Commit** with clear messages
6. **Push** to your fork
7. **Open** a Pull Request

### PR Checklist

- [ ] README follows the template
- [ ] All code/configs are tested
- [ ] Screenshots added if applicable
- [ ] Main README updated
- [ ] No sensitive data committed
- [ ] Spell check passed

### Review Process

1. Maintainers review within 48-72 hours
2. Address any feedback
3. Once approved, we'll merge!

## 🏆 Recognition

All contributors are:
- Listed in our Contributors section
- Credited in project READMEs
- Part of our DevOps learning community

---

## Questions?

- Open an issue with the `question` label
- Start a discussion in GitHub Discussions

**Thank you for helping others learn DevOps! 🚀**
