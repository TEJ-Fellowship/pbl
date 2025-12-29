# Use Golang image to build and run
FROM golang:1.25-alpine

WORKDIR /app

# Copy code to the container
COPY . .

# Build the app
RUN go build -o api ./cmd/api

# Expose the port
EXPOSE 8080

# Run the app
CMD ["./api"]


# # Build stage
# FROM golang:1.25-alpine AS builder
# WORKDIR /app
# COPY . .
# RUN go build -o api ./cmd/api

# # Final stage
# FROM alpine:latest
# WORKDIR /app
# COPY --from=builder /app/api .
# EXPOSE 8080
# CMD ["./api"]
