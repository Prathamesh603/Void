# AI Research Agent - Project Workflow

## 1. Project Overview
The AI Research Agent is a smart assistant designed to help researchers, students, and teachers quickly find, summarize, and verify information from scientific literature. Unlike generic AI assistants, this system uses **Retrieval-Augmented Generation (RAG)** and trusted sources (arXiv, PubMed, IEEE Xplore) to produce **verifiable, citation-backed answers**.

---

## 2. Project Phases & Timeline

| Phase | Duration | Goal | Deliverables |
|-------|---------|------|-------------|
| **Phase 0: Environment Setup** | Week 1–2 | Set up project environment, repo, and initial test | GitHub repo, virtual environment, sample “Hello World” RAG demo |
| **Phase 1: Data Retrieval** | Month 1–1.5 | Build pipeline to fetch and preprocess scientific papers | Working scripts to fetch, clean, and store raw & processed data |
| **Phase 2: RAG Pipeline** | Month 1.5–3 | Implement retrieval + LLM answer generation with inline citations | Prototype RAG pipeline returning citation-backed answers |
| **Phase 3: Summarization & Synthesis** | Month 3–4 | Generate human-readable summaries from multiple sources | Short and detailed summaries for queries |
| **Phase 4: User Interface** | Month 4–5 | Build UI for researchers to interact with the agent | Streamlit/FastAPI interface showing answers + references |
| **Phase 5: Evaluation & Paper Writing** | Month 5–6 | Evaluate accuracy, hallucination rate, and citation correctness; draft research paper | Evaluation report, metrics, research paper draft, final PDF |

---

## 3. Team Member Responsibilities

| Member | Module | Tasks |
|--------|--------|-------|
| **Member 1** | Data & Retrieval | API connectors (arXiv, PubMed, IEEE), fetch papers, preprocessing, store JSON, chunking |
| **Member 2** | RAG Pipeline & Embeddings | Build embeddings, FAISS indexing, retrieval + LLM answer generation, citation injection |
| **Member 3** | Frontend/UI | Streamlit/FastAPI interface, show answers, inline citations, explore related papers |
| **Member 4** | Evaluation & Research Paper | Design evaluation metrics, test system, compare with baseline, draft & finalize research paper |

> All members contribute to documentation, code review, and testing.

---

## 4. Module Workflow

### 4.1 Data Retrieval
1. Input query → API call to arXiv / PubMed / IEEE.
2. Fetch metadata: title, authors, abstract, URL.
3. Store raw JSON in `data/raw/`.
4. Preprocess: clean text, chunk ~500 tokens, handle citations.
5. Save processed chunks in `data/processed/`.

### 4.2 Embeddings & Vector DB
1. Load processed chunks.
2. Generate embeddings (sentence-transformers / OpenAI).
3. Store embeddings in FAISS / Pinecone (`data/embeddings/`).
4. Enables semantic retrieval for queries.

### 4.3 RAG Pipeline
1. Input query → embedding → search vector DB.
2. Retrieve top N relevant chunks.
3. Pass chunks + query to LLM.
4. Generate **citation-backed answer**.
5. Ensure inline citations and reference links are accurate.

### 4.4 Summarization
1. Merge multiple retrieved chunks.
2. Generate:
   - Short summary (2–3 sentences)
   - Detailed explanation (paragraphs with citations)
3. Ensure clear, human-like language.

### 4.5 User Interface
1. Input query box.
2. Display answers + inline citations.
3. Explore related papers / references.
4. Optional: conversation history for follow-up queries.

### 4.6 Evaluation
1. Measure hallucination rate: % of incorrect/unverifiable statements.
2. Measure citation accuracy: % of claims matched to correct paper.
3. Measure relevance: human evaluation of answer quality.
4. Compare RAG system vs baseline LLM answers.

---

## 5. Communication & Collaboration
- **Version Control:** GitHub repo with branches:
  - `main` → stable code
  - `dev` → merged features for testing
  - `feature/<module>` → individual module branches
- **Weekly Meetings:** Each member reports progress, blockers, and upcoming tasks.
- **Documentation:** Keep design notes and API usage in `docs/`.
- **Issue Tracking:** Use GitHub issues or project board to assign tasks and track progress.

---

## 6. Future Extensions
- PDF parsing for full-text papers.
- Multilingual support for non-English papers.
- Citation ranking (most cited first).
- Agentic query planning: break complex questions into sub-queries.
- Knowledge graph integration: link authors, citations, topics.

---

> This workflow ensures a **step-by-step, modular, and verifiable development process** for building a production-ready AI Research Agent.
