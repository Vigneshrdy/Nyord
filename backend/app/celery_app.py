from celery import Celery

celery_app = Celery(
    "banking_celery",
    broker="amqp://127.0.0.1",   # RabbitMQ broker
    backend="rpc://"             # result backend (simple)
)

# Route tasks to the default 'celery' queue so it matches the
# worker command you are using: `celery -A app.tasks worker -Q celery`.
# Previously this was set to a custom queue 'transaction.process',
# causing the worker (listening only on 'celery') to never receive tasks.
celery_app.conf.task_routes = {
    "process_transaction": {"queue": "celery"} ###
}