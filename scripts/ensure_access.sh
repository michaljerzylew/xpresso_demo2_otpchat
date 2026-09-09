#!/usr/bin/env bash
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?ERROR: CLOUDFLARE_API_TOKEN must be set}"
command -v jq >/dev/null || { echo 'ERROR: jq is required' >&2; exit 1; }

account="c0866374db94b0532272bcc90221f265"
domain="xs_demo2_chat.milkies.work"
idp="53523837-0fbc-48e1-af26-32b1108fb717"
endpoint="https://api.cloudflare.com/client/v4/accounts/$account/access/apps"

api() {
  printf 'Authorization: Bearer %s\n' "$CLOUDFLARE_API_TOKEN" |
    curl --silent --show-error --fail --header @- \
      --header 'Content-Type: application/json' "$@" |
    jq -e 'if .success == true then . else error("Cloudflare Access API error: " + (.errors[0].message // "unknown")) end'
}

# 1. Search for existing app
apps=$(api "$endpoint")
app_id=$(jq -r --arg domain "$domain" '.result[] | select(.domain == $domain) | .id' <<<"$apps")

if [[ -z "$app_id" ]]; then
  echo "Creating Access Application for $domain..."
  payload=$(jq -nc --arg domain "$domain" --arg idp "$idp" '{
    name: "OTP Chat",
    domain: $domain,
    type: "self_hosted",
    session_duration: "730h",
    auto_redirect_to_identity: true,
    allowed_idps: [$idp],
    app_launcher_visible: true,
    enable_binding_cookie: false,
    http_only_cookie_attribute: true,
    options_preflight_bypass: false,
    eager_redirect_cookie_setting: true
  }')
  res=$(api --request POST --data "$payload" "$endpoint")
  app_id=$(jq -r '.result.id' <<<"$res")
  echo "Created Access App ID: $app_id"
else
  echo "Access App already exists: $app_id"
fi

# 2. Check/create Allowed Team Members policy
emails=(
  "michaljerzylew@gmail.com"
  "michal.jerzy.lew@gmail.com"
  "adekpp@gmail.com"
  "iov118v@gmail.com"
  "ania@milkies.me"
  "getmilkies@gmail.com"
  "biuro@milkies.me"
  "kasiaexpromo@gmail.com"
  "pleskacz.m@gmail.com"
  "thevion@gmail.com"
  "krystian@stypula.pl"
  "tomasz.lasecki@gmail.com"
  "aj@radcowieszczecin.pl"
  "radekw07@gmail.com"
  "g.gawlik@pomerangels.com"
  "rlew@amu.edu.pl"
  "marek.choim@franklincovey.pl"
  "wojtek.faszczewski@gmail.com"
  "pawel@fornalski.pl"
  "adam@sls.pl"
  "bartoszmatyjewicz@americanlens.pl"
  "krystian@americanlens.pl"
  "keepmoments.de@gmail.com"
  "noemi.iwaniuk@gmail.com"
  "lukasz040609@gmail.com"
  "kasialewpl@gmail.com"
  "emilia.michniewicz@gmail.com"
  "milena.szwemmer@gmail.com"
)

inc=$(printf '%s\n' "${emails[@]}" | jq -R '{email: {email: .}}' | jq -s .)
policy_payload=$(jq -nc --argjson inc "$inc" '{
  name: "Allowed Team Members",
  decision: "allow",
  precedence: 1,
  include: $inc,
  exclude: [],
  require: []
}')

policies=$(api "$endpoint/$app_id/policies")
policy_id=$(jq -r '.result[] | select(.name == "Allowed Team Members") | .id' <<<"$policies")

if [[ -z "$policy_id" ]]; then
  echo "Creating Access Policy 'Allowed Team Members' with 28 emails..."
  api --request POST --data "$policy_payload" "$endpoint/$app_id/policies" >/dev/null
  echo "Created Access Policy successfully."
else
  echo "Updating Access Policy $policy_id with 28 emails..."
  api --request PUT --data "$policy_payload" "$endpoint/$app_id/policies/$policy_id" >/dev/null
  echo "Updated Access Policy successfully."
fi
