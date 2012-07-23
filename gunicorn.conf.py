bind = "127.0.0.1:8001"
logfile = "/var/log/gunicorn/mtgviz.log"
workers=2
worker_class='gevent'
