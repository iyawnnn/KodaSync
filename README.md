# KodaSync | Neural Code & Knowledge Engine

![KodaSync CI](https://github.com/iyawnnn/kodasync/actions/workflows/test.yml/badge.svg)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

KodaSync is a high-performance intelligence hub built for software engineers to centralize and interact with technical knowledge. By combining a professional Monaco-powered editor with contextual AI agents, KodaSync transforms scattered snippets into a searchable, neural knowledge base. The platform leverages advanced vector search to ensure engineers can find and chat with their technical data in real-time, maintaining critical context across complex projects.

## Technical Solution

KodaSync solves the "lost context" problem inherent in modern software development. It creates a semantic layer over every saved note using high-dimensional vector embeddings, allowing the system to understand the underlying intent of code rather than relying on simple keyword matching.

### Key Functional Areas

* **Neural Chat Interface:** An AI-powered workspace utilizing **Retrieval Augmented Generation (RAG)**. It automatically retrieves the most relevant notes from your library to provide accurate, project-specific answers.
* **The Studio (Code Editor):** A full-featured editor built with the **Monaco Editor** engine. It includes integrated AI actions to fix bugs, write documentation, scan for security vulnerabilities, and generate unit tests instantly.
* **Semantic Note Library:** A centralized repository where every note is processed in the background to generate technical tags and vector embeddings for instant semantic search.
* **Project Contextualization:** Group technical data into specific projects. Users can set a project "context" during chats to restrict the knowledge base to specific technical requirements and architectural rules.
* **Knowledge Scraper:** A specialized utility to import data directly from documentation URLs. It automatically scrapes, cleans, and summarizes web content to expand your neural brain.



## Tech Stack

The platform is architected for low latency and high concurrency using a modern, async-first approach.

### Frontend
* **Next.js 15 (App Router):** Leverages React Server Components (RSC) for optimized performance and client-side interactivity for the chat and editor.
* **Tailwind CSS & Shadcn/ui:** Implementation of a "Dark Glass" aesthetic with backdrop blurs and professional gradients.
* **Monaco Editor:** Powers the code editing experience with VS Code-grade syntax highlighting and manipulation.
* **Sonner & Lucide:** Streamlined notifications and high-signal technical iconography.

### Backend
* **FastAPI:** A high-performance Python framework handling API requests asynchronously to prevent blocking during AI generation.
* **SQLModel:** A hybrid of SQLAlchemy and Pydantic providing full type safety for database interactions.
* **Groq SDK (Llama 3.1/3.3):** Powers the AI core with high-speed Llama models (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`).
* **SlowAPI:** Implements token-bucket rate limiting to ensure system stability.

### Database & Cache
* **PostgreSQL with pgvector:** Stores structured user data and high-dimensional vector embeddings for semantic search.
* **Redis:** High-speed cache for AI responses, search results, and rate limiting state management.

## Deployment & Infrastructure

Designed for cloud scalability and consistent developer experience:

* **Docker & Docker Compose:** Fully containerized environment for both local development and production reliability.
* **GitHub Actions (CI/CD):** Automated workflow that runs the full test suite on every push to ensure code quality.
* **Hosting:** Backend deployed on **Render** (Python runtime) and Frontend on **Vercel** (Edge network).
* **Infrastructure:** Managed **Supabase** for PostgreSQL/Vector storage and **Upstash** for serverless Redis.

## Operational Features

* **Hybrid Authentication:** Secure access via traditional credentials or **GitHub OAuth** integration.
* **Robust Testing Suite:** Integrated **Pytest** workflow covering API endpoints, authentication, and RAG logic.
* **Semantic Search Engine:** Utilizes the **FastEmbed** library to generate 384-dimension vectors for natural language searching.
* **Background Processing:** Dispatches non-blocking AI tasks for tag generation and embedding calculations.
