FROM python:3.10-slim
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Remove dev/test files from production image
RUN rm -f test_*.py *.ps1 generate_*.py train_*.py import_*.py

USER appuser
EXPOSE 5000
CMD ["python", "app.py"]
