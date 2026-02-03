# Retail Store Comparison Monorepo

This is a Python monorepo managed with **uv**.

## Structure

```
retail-store-comparison/
├── pyproject.toml          # Root workspace configuration
├── monorepo/
│   └── scraper/           # Retail store scraper project
│       ├── pyproject.toml
│       └── ...
└── databases/             # Database setup
```

## Setup

### 1. Install uv

```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
uv sync

# Or install specific package
cd packages/scraper
uv pip install -e .
```

## Running the Scraper

```bash
# From root
uv run python monorepo/scraper/main.py

# Or from scraper directory
cd monorepo/scraper
uv run python main.py
```

## Development

```bash
# Add a dependency to scraper package
cd monorepo/scraper
uv add requests

# Add a dev dependency to workspace
uv add --dev pytest

# Run tests
uv run pytest

# Lint with ruff
uv run ruff check .
```

## Adding New Packages

```bash
# Create a new package
mkdir -p monorepo/api
cd monorepo/api

# Initialize with pyproject.toml
uv init
```

Then add it to the workspace members in the root `pyproject.toml`.
