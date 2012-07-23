#!/bin/bash
#Run gunicorn
gunicorn app:app -c /home/erik/Code/VasirSite-Flask/gunicorn.conf.py
