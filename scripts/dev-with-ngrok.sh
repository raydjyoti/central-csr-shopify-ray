#!/bin/zsh
set -euo pipefail

# Port your Shopify CLI proxy should bind to
PORT=${PORT:-4443}

# Ensure ngrok is running and get current https public URL from local API
ensure_ngrok() {
  if ! curl -sf localhost:4040/api/tunnels >/dev/null 2>&1; then
    echo "Starting ngrok on :$PORT..."
    nohup ngrok http $PORT > /tmp/ngrok.log 2>&1 &
    for i in {1..30}; do
      sleep 1
      curl -sf localhost:4040/api/tunnels >/dev/null 2>&1 && break
    done
  fi
}

current_tunnel() {
  curl -s localhost:4040/api/tunnels | node -e '
let s="";process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{try{const j=JSON.parse(s);const t=(j.tunnels||[]).find(x=>x.proto==="https");if(!t)process.exit(1);console.log(t.public_url)}catch(e){process.exit(1)}});
'
}

ensure_ngrok
TUNNEL_URL=$(current_tunnel)
if [ -z "${TUNNEL_URL}" ]; then
  echo "Failed to detect ngrok https tunnel via http://localhost:4040" >&2
  exit 1
fi

echo "Using tunnel: ${TUNNEL_URL}:${PORT}"
export SHOPIFY_FLAG_TUNNEL_URL="${TUNNEL_URL}:${PORT}"

exec shopify app dev


