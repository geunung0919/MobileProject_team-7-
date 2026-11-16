FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-kor tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 analyzer

WORKDIR /app
COPY requirements-lock.txt requirements-firebase.txt ./
RUN python -m pip install --no-cache-dir -r requirements-firebase.txt
COPY app ./app
COPY data ./data

ENV CORE_AUTH_MODE=firebase \
    DATABASE_URL=sqlite:////tmp/receipt-analysis.db \
    RECEIPT_SERVER_OCR=tesseract \
    PORT=8080 \
    PYTHONDONTWRITEBYTECODE=1

USER 10001
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:create_app --factory --host 0.0.0.0 --port \"$PORT\""]
