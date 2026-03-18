"""
Gunicorn production configuration.

Worker count formula: (2 × CPU cores) + 1
gthread worker class enables threading within each worker process,
handling more concurrent requests without spawning extra processes.
"""
import multiprocessing
import os

# ── Workers ────────────────────────────────────────────────────────────────
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"
threads = 4
worker_connections = 1000

# ── Timeouts ────────────────────────────────────────────────────────────────
timeout = 30
keepalive = 5
graceful_timeout = 30

# ── Binding ─────────────────────────────────────────────────────────────────
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"

# ── Logging ─────────────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog = "-"    # stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sµs'

# ── Process naming ───────────────────────────────────────────────────────────
proc_name = "hrms-api"

# ── Performance ──────────────────────────────────────────────────────────────
max_requests = 1000          # Restart workers after 1000 requests (prevents memory leaks)
max_requests_jitter = 100    # Adds randomness to avoid all workers restarting simultaneously
preload_app = True           # Load app before forking workers — saves memory via copy-on-write
