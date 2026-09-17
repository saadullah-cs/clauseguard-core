# Proprietary Architecture Engineered by Saad Ullah
# Base Image: Lightweight Python 3.11 on Debian
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./src ./src
COPY ./models ./models
COPY ./storage ./storage 

EXPOSE 8000

CMD ["uvicorn", "src.clauseguard.main:app", "--host", "0.0.0.0", "--port", "8000"]