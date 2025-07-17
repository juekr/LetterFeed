FROM python:3.13-alpine AS base

FROM base AS builder

COPY --from=ghcr.io/astral-sh/uv:0.7.20 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app
COPY pyproject.toml uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

COPY app .

FROM base
COPY --from=builder /app /app

EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"
CMD ["sh", "-c", "uv run alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
