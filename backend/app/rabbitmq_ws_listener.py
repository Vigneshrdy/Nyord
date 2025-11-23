import pika
import json
import asyncio
from .websocket_manager import manager

def rabbitmq_ws_listener():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters("127.0.0.1")
    )
    channel = connection.channel()

    channel.exchange_declare(
        exchange="ws_events",
        exchange_type="fanout",
        durable=True
    )

    result = channel.queue_declare(queue="", exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(
        exchange="ws_events",
        queue=queue_name
    )

    print("🔊 RabbitMQ WS Listener started…")

    def callback(ch, method, properties, body):
        event = json.loads(body.decode())
        # Run the async broadcast function from our sync callback
        asyncio.run(manager.broadcast(event))

    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=True
    )

    # Blocking call — this stays in its own thread
    channel.start_consuming()