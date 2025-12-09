// Kafka configuration

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: `whatsapp-clone-${process.env.SERVER_ID || 'default'}`,
  brokers: process.env.KAFKA_BROKERS 
    ? process.env.KAFKA_BROKERS.split(',') 
    : ['localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10,
    multiplier: 2,
    maxRetryTime: 30000,
  },
  connectionTimeout: 10000,
  requestTimeout: 30000,
  logLevel: process.env.KAFKA_LOG_LEVEL || 1, // 0: NOTHING, 1: ERROR, 2: WARN, 4: INFO, 5: DEBUG
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
  maxInFlightRequests: 1,
  idempotent: true,
});

export const consumer = kafka.consumer({ 
  groupId: 'whatsapp-message-status-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  allowAutoTopicCreation: true,
  retry: {
    initialRetryTime: 300,
    retries: 10,
    multiplier: 2,
    maxRetryTime: 30000,
  },
});

export default kafka;