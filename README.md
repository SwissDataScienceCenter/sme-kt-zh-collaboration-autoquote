# Auto Quote

Automatic quote generation for SMEs. A customer request (email, meeting notes…) goes in; the app extracts the details it needs. When
something is missing, it drafts an email asking for it. When everything is there, it finds similar past requests and offers, builds a quote
from the product catalogue (as a PDF) and drafts the email that goes with it. Its knowledge comes from the company's datasheets and past
offers.

The repository holds a Python backend (`backend/`) and a React frontend (`frontend/`).

**Status**: the whole pipeline works (extraction, retrieval, quote with PDF, follow-up email), as do document indexing, the product
catalogue and the configuration pages. There is no quote history yet: a quote lives in the Playground until the next run.

## Prerequisites

- Python 3.14 and [uv](https://docs.astral.sh/uv/)
- Node.js 22 or later and npm
- Access to a language model through an API implementing the OpenAI Responses API with structured outputs and function calling, and an
  embedding model on the same server (OpenAI, Ollama, …)

## Quick start

From the repository root:

```sh
# 1. Configure the environment
cp .env.template .env.local
# then edit .env.local: set LLM_API_KEY, LLM_MODEL and EMBEDDING_MODEL (and LLM_BASE_URL when not using OpenAI)

# 2. Start the backend (terminal 1)
cd backend
uv sync
make dev

# 3. Start the frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.template` to `.env.local` at the repository root and fill in the values. The active env file is selected by the `ENV` variable
of the shell (default `local`, so `.env.local` is read); it is read before the env file, so it cannot be set inside it.

| Variable                | Description                                                                                          |
|-------------------------|------------------------------------------------------------------------------------------------------|
| `SESSION_COOKIE_SECURE` | `false` for local development over plain http, `true` (default) when served over https.              |
| `LLM_BASE_URL`          | Empty for OpenAI, otherwise the server's base url, e.g. `http://localhost:11434/v1` for Ollama.       |
| `LLM_API_KEY`           | API key of the LLM server (any non-empty value for servers without authentication).                  |
| `LLM_MODEL`             | Model name as the server knows it. It must support structured outputs (JSON schema, strict mode) and function calling. |
| `EMBEDDING_MODEL`       | Embedding model on the same server, used to find similar past cases, e.g. `text-embedding-3-small` or `nomic-embed-text`. |

## Backend

```sh
cd backend
uv sync
make dev
```

The API is served on [http://localhost:8000](http://localhost:8000), with its interactive docs on `/docs`. `make dev` reloads on code
changes; restart it after changing the env file or the JSON files in `backend/data/` by hand.

Lint and format:

```sh
uv run ruff check --fix
uv run ruff format
```

New dependencies are added with `uv add <package>` (or `uv add --dev <package>` for development dependencies). Check the license
(permissive only, no copyleft) and known vulnerabilities first. After changing dependencies, refresh the exported requirements:

```sh
uv export --frozen --no-dev --no-emit-project --output-file=requirements.txt
```

## Frontend

```sh
cd frontend
npm install
npm run dev
```

The app is served on [http://localhost:3000](http://localhost:3000). Requests to `/api` are proxied to the backend on port 8000, so start
the backend first.

Lint and format:

```sh
npm run lint
npm run format
```

## Pre-commit hooks

The hooks are configured at the repository root and cover both parts. `pre-commit` is installed in the backend environment, so run these from the
repository root after `uv sync`:

```sh
uv run --project backend pre-commit install
uv run --project backend pre-commit run --all-files
```

## Using the app

The app has two areas: **Admin**, where the company's knowledge and rules are configured, and **Playground**, where a request is run
through the pipeline. Everything configured in Admin is shared by all users of the instance.

### 1. Admin → Entity extraction

The schema of the details to extract from a request: one row per field, with a key, a label, a type (text, integer, number, date, enum,
boolean), a description for the model and whether it is required. Required fields that are missing make the follow-up email ask the
customer for them.

- Select a row to edit it, or **Add field**.
- **Import** / **Export** the schema as Excel or JSON (handy to edit many fields at once).
- **Preview** shows the prompt and the structured output sent to the model.

### 2. Admin → Documents

The company's documents, indexed by the model:

1. Copy the files into `backend/data/documents/` (PDF, DOCX or TXT; scanned PDFs without text cannot be read).
2. Click **Index**. Each new file is classified as **datasheet**, **request**, **offer** or **unknown**, and summarised. Indexing runs in the
   background; the progress refreshes every 10 seconds. Files already indexed are skipped, so click **Index** again whenever you add files.
3. **Datasheets** add their products to the catalogue below (reference, description, unit, unit price and every property as a spec).
   **Offers** fill in the price of catalogue products that have none yet. Indexing never overwrites a price.
4. In the **Products** table, select a row to edit a product (e.g. set a missing price), or **Add product** by hand.

**Delete index** removes all indexed documents **and all products**, including those added or priced by hand. The files themselves are kept,
so they can be indexed again.

### 3. Admin → Quote configuration

How the agent will build quotes:

- **Extra margin (%)**: added to every unit price by the quote function, never shown to the customer.
- **Business rules**: free text added to the quote prompt, e.g. how many hours to plan, when to add a flat fee, validity and payment
  terms. One rule per line works best. Prices are expected to already include VAT and discounts.
- **Preview** shows the draft quote prompt and the `build_quote` tool. **Reset to default** restores the built-in rules and keeps the margin.

### 4. Admin → Follow-up

The prompt for the follow-up email: a system prompt (role, tone and rules for every email), the instruction used when information is
missing, and the one used when everything is there. **Preview** shows what is sent for each case, **Reset to default** restores the
built-in texts.

### 5. Playground

Paste a customer message, choose the reply language and click **Run**. The pipeline runs in four steps, each with its tab:

1. **Extraction**: each field with its value, status (found, assumed, partial, missing) and the words of the message supporting it.
2. **Retrieval**: the indexed requests and offers closest in meaning to the message, with a similarity score. Click a file name to open
   the document in a new tab.
3. **Quote**: the agent picks catalogue products and quantities following the business rules and the similar offers, and returns them
   through a `build_quote` tool call. Prices come from the catalogue and the margin is added in code, never by the model. Anything the
   catalogue cannot price (work, missing products) becomes an **Extra** line priced by the agent, highlighted in yellow so you check it
   before sending. **Download PDF** gives the quote to attach. **Request changes** opens a dialog where you tell the agent what to
   change (e.g. "they have their own room, remove the venue"); it rebuilds the quote with the same similar cases, and the follow-up
   email is written again to match.
4. **Follow-up**: the draft email, ready to copy. With a quote it announces the attached PDF.

When a required field is missing, retrieval and quote are skipped and the follow-up asks the customer for the missing details.

## Data

Everything the app stores lives in `backend/data/` (ignored by git):

| Path                             | Content                                                       |
|----------------------------------|---------------------------------------------------------------|
| `documents/`                     | The document files to index.                                   |
| `indexed_documents.json`         | The index: one record per document, with category and summary. |
| `products.json`                  | The product catalogue.                                         |
| `extraction_configurations.json` | The extraction schema.                                         |
| `extractions.json`               | Every pipeline run with its quote adjustments, as a log.       |
| `follow_up_configurations.json`  | The follow-up email prompts.                                   |
| `quote_configurations.json`      | The margin and business rules.                                 |
| `chroma/`                        | The embeddings of the indexed requests and offers (ChromaDB).  |

The JSON files are read at startup and written on every change. Embeddings are computed the first time retrieval runs for each indexed
request or offer, and stored in `chroma/`. Back up the folder to keep a configuration. Deleting a configuration file brings back the built-in
default on first use; deleting `indexed_documents.json` or `products.json` starts from an empty index or catalogue. There are no automatic migrations: when a new version adds a required field, existing
files must be updated by hand (or deleted).

## Troubleshooting

- **Every page shows "Loading…"**: the backend is not running or crashed at startup. Check its terminal; a validation error usually means a
  JSON file in `backend/data/` does not match the current version (see Data).
- **The pipeline or indexing fails**: check the LLM settings in `.env.local` and that the model supports structured outputs. The backend
  logs the error with the model's name.
- **A document stays pending after indexing**: it could not be read (e.g. a scanned PDF) or the model's answer was invalid. The notice lists
  the failed files; the backend log says why. Fix the file and click **Index** again.
- **Changes to `.env.local` are ignored**: restart the backend.
- **Retrieval fails after changing `EMBEDDING_MODEL`**: the stored embeddings come from the previous model. Stop the backend, delete
  `backend/data/chroma/` and run again; they are recomputed.
- **The quote step fails with "did not call build_quote"**: the model or server does not support forced function calling; use a model
  that does.

## Making it your own

- **LLM**: `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` in the env file. Any server implementing the OpenAI Responses API works (OpenAI,
  Ollama, …). The prompts live in `backend/src/auto_quote/utils/`: `extraction_prompt.py`, `follow_up_prompt.py`,
  `document_index_prompt.py` (classification and product extraction) and `quote_prompt.py` (the quote prompt, its `build_quote` tool and
  the pricing of its result).
- **Extraction schema**: edited in Admin → Entity extraction. The schema a fresh install starts with is `DEFAULT_EXTRACTION_CONFIGURATION` in
  `backend/src/auto_quote/controllers/extraction_configuration.py`.
- **Follow-up prompt**: edited in Admin → Follow-up. The built-in defaults (also used by "Reset to default") are
  `DEFAULT_FOLLOW_UP_CONFIGURATION` in `backend/src/auto_quote/controllers/follow_up_configuration.py`.
- **Quote configuration**: edited in Admin → Quote configuration. The defaults (also used by "Reset to default" for the rules) are in
  `backend/src/auto_quote/controllers/quote_configuration.py`.
- **Branding**: `branding/branding.json` and `branding/logo.png` at the root, read by both parts. The name, description, logo and
  `logoAlt` are used by the app header and page title; the name, `details` (address and contact lines) and logo head every quote PDF. The
  `colors` set the `--primary` and `--ink` CSS variables of the app; `ink` also colours the PDF's name, title, headings and table rules.
  The logo must be a PNG (the PDF library cannot draw SVG). The quote PDF layout is `ReportLabQuoteRenderer` in `backend/src/auto_quote/documents/renderer/reportlab.py`.
- **Retrieval**: how many similar cases are used (`SIMILAR_DOCUMENTS_LIMIT`) is in `backend/src/auto_quote/controllers/retrieval.py`.
  Embeddings are stored with ChromaDB, embedded in the backend (no Chroma server); the implementation is
  `backend/src/auto_quote/models/chroma/document_vector.py`.
- **Documents and products**: see Admin → Documents above. Supported file types are the `document_readers` in
  `backend/src/auto_quote/main.py`; a new type needs a `DocumentReader` in `backend/src/auto_quote/documents/reader/`.
- **Backend wiring** (which auth, storage and LLM implementations are used, where the data folder is): `backend/src/auto_quote/main.py`.
- **Theme** (colours, radius, fonts): the CSS variables in `frontend/src/styles.css`, set to the SDSC design system, except the brand
  colours, which come from the branding. Button styles are the variants in `frontend/src/components/ui/button.tsx`.
- **Translations**: one file per language in `frontend/src/lib/lang/` (English, German, French, Italian). `en.ts` is the source of truth;
  the other languages must define the same keys.
- **Routes**: one file per route in `frontend/src/routes/`, each rendering a view from `frontend/src/views/`.

## Docker / deploy

Not set up yet. There is no login: anyone who can reach the app can change its configuration, so do not expose it publicly as is.
