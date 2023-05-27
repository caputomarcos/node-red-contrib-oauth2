#!/usr/bin/env bash

PROXY_COMMAND="simple-proxy -port 8000 -protocol https -cert server-cert.pem -key server-key.pem -log-headers -basic-auth username:password -v 4"
LOG_FILE="proxy.log"
PID_FILE="proxy.pid"

start_proxy() {
  if [ -f "$PID_FILE" ]; then
    echo "Proxy is already running. PID: $(cat $PID_FILE)"
    exit 1
  fi

  echo "Starting proxy..."
  $PROXY_COMMAND >> $LOG_FILE 2>&1 & echo $! > $PID_FILE
  echo "Proxy started. PID: $(cat $PID_FILE)"
}

stop_proxy() {
  if [ ! -f "$PID_FILE" ]; then
    echo "Proxy is not running."
    exit 1
  fi

  PID=$(cat $PID_FILE)
  echo "Stopping proxy. PID: $PID"
  kill $PID
  rm $PID_FILE
  echo "Proxy stopped."
}

status_proxy() {
  if [ -f "$PID_FILE" ]; then
    echo "Proxy is running. PID: $(cat $PID_FILE)"
  else
    echo "Proxy is not running."
  fi
}

tail_log() {
  tail -f $LOG_FILE
}

show_help() {
  echo "Usage: $0 [command]"
  echo "Commands:"
  echo "  start   - Start the proxy"
  echo "  stop    - Stop the proxy"
  echo "  status  - Check the status of the proxy"
  echo "  log     - Display the proxy log"
  echo "  help    - Show this help message"
}

case "$1" in
  start)
    start_proxy
    ;;
  stop)
    stop_proxy
    ;;
  status)
    status_proxy
    ;;
  log)
    tail_log
    ;;
  help)
    show_help
    ;;
  *)
    show_help
    exit 1
esac

exit 0
