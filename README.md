# KodaSync | Neural Code & Knowledge Engine

![KodaSync CI](https://github.com/iyawnnn/kodasync/actions/workflows/test.yml/badge.svg)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

KodaSync is a professional intelligence hub designed to centralize technical knowledge for software engineers. It combines a high-performance code editor with contextual AI agents to transform scattered code snippets into a searchable, neural knowledge base.

## Technical Solution

The platform solves the "lost context" problem in modern development by creating a semantic layer over every saved note. By utilizing high-dimensional vector embeddings, KodaSync understands the underlying intent and logic of your code rather than relying on traditional keyword matching.

### Key Functional Areas

* **Neural Chat Interface:** An AI-powered workspace using **Retrieval Augmented Generation (RAG)** to provide accurate, project-specific answers by referencing your personal library.
* **The Studio:** A full-featured code editor built with the **Monaco Editor** engine (the core of VS Code) for a native development experience.
* **Semantic Note Library:** A centralized repository where notes are processed in the background to generate technical tags and embeddings automatically.
* **Project Contextualization:** Organizes technical data into projects, allowing users to restrict AI agents to specific architectural rules and requirements.
* **Knowledge Scraper:** A specialized utility that imports and cleans data directly from technical documentation URLs to expand the neural brain.

## Tech Stack

The architecture is built for low latency and high concurrency using an async-first approach.

### Frontend
* **Next.js 15 (App Router):** High-performance React framework.
* **Tailwind CSS & Shadcn/ui:** Modern, responsive design system.
* **Monaco Editor:** Professional-grade code editing and syntax highlighting.
* **Axios:** Robust HTTP client for API communication.
* **Lucide React & Sonner:** Streamlined technical iconography and toast notifications.

### Backend
* **FastAPI:** A modern, high-performance Python framework used for building the primary API with asynchronous support.
* **SQLModel:** Elegant database interaction combining SQLAlchemy and Pydantic.
* **Groq SDK (Llama 3.1/3.3):** Powers the AI core with ultra-fast inference for technical reasoning.
* **SlowAPI:** Token-bucket rate limiting to ensure system stability.
* **Jose (JWT):** Secure, industry-standard authentication and session management.

### Database & Cache
* **PostgreSQL with pgvector (Supabase):** Relational storage with specialized vector support for semantic retrieval.
* **Redis (Upstash):** High-speed caching for AI responses and rate-limiting state.

## Core Features

* **RAG Chat System:** Automatically retrieves relevant notes from your library to provide context-aware answers.
* **AI Code Actions:** Integrated tools to **Fix**, **Document**, **Scan Security**, and **Generate Tests** instantly from the editor.
* **Semantic Search:** Natural language search powered by **FastEmbed** 384-dimension vectors.
* **URL Scraper:** Seamlessly import technical snippets and full documentation pages from the web.
* **Background AI Tasking:** Non-blocking tag generation and embedding calculations to keep the UI responsive.
* **Hybrid Authentication:** Support for traditional credentials and secure **GitHub OAuth** integration.
* **Project Isolation:** Scope your searches and AI context to specific project boundaries.
* **Real-time Event Bus:** Custom UI events ensure the sidebar and library update instantly during modifications.

## Deployment & Infrastructure

Designed for consistency across development and production environments.

* **Docker & Docker Compose:** Full containerization to ensure environment parity and simplified local setup.
* **GitHub Actions:** A robust CI/CD pipeline that executes the full integration test suite on every push.
* **Pytest:** Comprehensive testing suite covering API endpoints, authentication flows, and RAG logic.
* **Managed Hosting:** Backend deployed on **Render** (Python 3 runtime) and Frontend on **Vercel** (Edge network).
