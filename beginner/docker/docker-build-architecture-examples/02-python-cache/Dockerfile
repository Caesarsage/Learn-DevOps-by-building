FROM python:3.9-slim
WORKDIR /app
# Copy requirements first to leverage cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy frequently-changing code last
COPY src/ ./src/
COPY main.py .
CMD ["python", "main.py"]
