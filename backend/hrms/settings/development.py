from .base import *
from decouple import config, Csv

DEBUG = True

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://localhost:3000",
    cast=Csv(),
)

# Use console email backend in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
