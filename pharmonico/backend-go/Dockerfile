# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the API binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api ./cmd/api

# Build the worker binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/worker ./cmd/worker

# API runtime stage
FROM alpine:3.19 AS api

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /bin/api /app/api

EXPOSE 8080

CMD ["/app/api"]

# Worker runtime stage
FROM alpine:3.19 AS worker

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /bin/worker /app/worker

CMD ["/app/worker"]

