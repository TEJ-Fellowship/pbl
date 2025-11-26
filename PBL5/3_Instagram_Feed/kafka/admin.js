import { kafka } from './client.js';


async function main() {
    const admin = kafka.admin();
    console.log('Connecting to Kafka');

    await admin.connect();
    console.log('Connected to Kafka successfully');

    console.log('Creating topics [pos]');
    await admin.createTopics({
        topics: [
            { topic: 'pos', numPartitions: 1 },
        ],
    });

    await admin.disconnect();
    console.log('Disconnected from Kafka successfully');
}

main()