import pika
import json

def publish_event(queue_name: str, payload: dict):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters("localhost")
    )
    channel = connection.channel()

    channel.queue_declare(queue=queue_name, durable=True)

    message = json.dumps(payload)

    channel.basic_publish(
        exchange="",
        routing_key=queue_name,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2
        ),
    )

    connection.close()