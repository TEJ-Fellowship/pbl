import { kafka } from './client.js';


async function main() {

    const producer = kafka.producer()
    console.log('Connecting to producer')

    await producer.connect()
    console.log('Connected to producer successfully')


    await producer.send({
        topic: 'pos',
        messages: [
            { value: 'Hello Kafka' },
        ],
    })
    console.log('Message sent successfully')
    await producer.disconnect()
    console.log('Disconnected from producer successfully')
}


main()