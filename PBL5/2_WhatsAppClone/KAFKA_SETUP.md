# Kafka Setup Guide

This guide explains how to set up and run Kafka for the WhatsApp Clone application.

## Prerequisites

- Docker and Docker Compose installed
- Node.js backend application

## Quick Start

1. **Start Kafka using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Verify Kafka is running:**
   ```bash
   docker-compose ps
   ```

3. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

The backend will automatically:
- Connect to Kafka at `localhost:9092`
- Create required topics if they don't exist
- Start the Kafka consumer for message status updates

## Kafka Services

The `docker-compose.yml` includes:

- **Kafka Broker** (port 9092): Main Kafka service running in KRaft mode (no Zookeeper required)
- **Kafka UI** (port 8080): Web interface for managing Kafka

**Note:** This setup uses KRaft (Kafka Raft) mode, which eliminates the need for Zookeeper. Kafka runs in a self-contained mode with built-in metadata management.

## Accessing Kafka UI

Open your browser and navigate to:
```
http://localhost:8080
```

You can use Kafka UI to:
- View topics and messages
- Monitor consumer groups
- Inspect message content
- Manage topics

## Environment Variables

You can configure Kafka connection using environment variables:

```bash
# Kafka brokers (comma-separated for multiple brokers)
KAFKA_BROKERS=localhost:9092

# Optional: Kafka log level (0-5)
KAFKA_LOG_LEVEL=1
```

Default values:
- `KAFKA_BROKERS`: `localhost:9092`
- `KAFKA_LOG_LEVEL`: `1` (ERROR level)

## Kafka Topics

The application uses the following topics:

- `message-sent`: Published when a message is sent
- `message-delivered`: Published when a message is delivered to a recipient
- `message-read`: Published when a message is read by a recipient

Topics are automatically created on server startup with:
- 3 partitions
- 1 replication factor (suitable for development)
- 7-day retention period

## Troubleshooting

### Kafka connection errors

If you see connection errors:

1. **Check if Kafka is running:**
   ```bash
   docker-compose ps
   ```

2. **Check Kafka logs:**
   ```bash
   docker-compose logs kafka
   ```

3. **Restart Kafka:**
   ```bash
   docker-compose restart kafka
   ```

### Topics not created

Topics are created automatically on server startup. If topics are missing:

1. Check server logs for Kafka initialization messages
2. Verify Kafka is accessible at `localhost:9092`
3. Manually create topics using Kafka UI or CLI

### Consumer not receiving messages

1. Verify consumer is connected (check server logs)
2. Check if producer is publishing messages (check server logs)
3. Verify topics exist in Kafka UI
4. Check consumer group status in Kafka UI

## Stopping Kafka

To stop all Kafka services:
```bash
docker-compose down
```

To stop and remove volumes (clears all data):
```bash
docker-compose down -v
```

## Production Considerations

For production environments:

1. **Increase replication factor** for topics (minimum 3)
2. **Use multiple Kafka brokers** for high availability
3. **Configure proper retention policies** based on your needs
4. **Set up monitoring** and alerting
5. **Use SASL/SSL** for secure connections
6. **Configure proper resource limits** in Docker

## Additional Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Kafka UI Documentation](https://github.com/provectus/kafka-ui)

