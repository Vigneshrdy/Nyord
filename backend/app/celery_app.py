from celery import Celery
from celery.schedules import crontab

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
    "process_transaction": {"queue": "celery"},
    "auto_debit_loan_emi": {"queue": "celery"}
}

# Schedule periodic tasks
celery_app.conf.beat_schedule = {
    'auto-debit-loan-emi-daily': {
        'task': 'auto_debit_loan_emi',
        'schedule': crontab(hour=0, minute=0),  # Run daily at midnight
    },
}

celery_app.conf.timezone = 'UTC'