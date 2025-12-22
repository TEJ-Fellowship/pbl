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
