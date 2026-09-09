#!/usr/bin/env bash
set +x
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?ERROR: CLOUDFLARE_API_TOKEN must be set and non-empty}"
command -v jq >/dev/null || { echo 'ERROR: jq is required' >&2; exit 1; }

zone='78d2442920a4612b381ca27fd643082b'
name='xs_demo2_chat.milkies.work'
endpoint="https://api.cloudflare.com/client/v4/zones/$zone/dns_records"

api() {
  printf 'Authorization: Bearer %s\n' "$CLOUDFLARE_API_TOKEN" |
    curl --silent --show-error --fail --header @- \
      --header 'Content-Type: application/json' "$@" |
    jq -e 'if .success == true then . else error("Cloudflare API reported failure") end'
}

records=$(api "$endpoint?name=$name&per_page=100")
if ! jq -e '.result_info.total_pages <= 1' <<<"$records" >/dev/null; then
  echo 'ERROR: unexpected DNS pagination; inspect records before retrying' >&2
  exit 1
fi
addresses=$(jq '[.result[] | select(.type == "AAAA" or .type == "A" or .type == "CNAME")]' <<<"$records")
if jq -e 'length == 1 and .[0].type == "AAAA" and .[0].content == "100::" and .[0].proxied == true' <<<"$addresses" >/dev/null; then
  echo "DNS already correct: $name AAAA 100:: (proxied)"
elif jq -e 'length == 0' <<<"$addresses" >/dev/null; then
  payload=$(jq -nc --arg name "$name" '{type:"AAAA",name:$name,content:"100::",proxied:true,ttl:1}')
  api --request POST --data "$payload" "$endpoint" >/dev/null
  echo "Created DNS: $name AAAA 100:: (proxied)"
else
  echo "ERROR: conflicting address records for $name; no changes made" >&2
  exit 1
fi
