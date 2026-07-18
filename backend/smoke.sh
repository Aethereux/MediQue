#!/bin/bash
# MediQue API smoke test.
# Assumes the API is ALREADY RUNNING on :8000 against a FRESHLY SEEDED medique.db
# (delete medique.db and restart uvicorn before running — the test books, cancels,
# and creates a specialty, so a re-run against the same DB will fail some checks).
set -u
BASE=http://localhost:8000/api
PASS=0; FAIL=0
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

check() { # name actual expected
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "ok   $1"
  else FAIL=$((FAIL+1)); echo "FAIL $1: got '$2' want '$3'"; fi
}

jget() { # $BODY + python expression over parsed JSON d
  printf '%s' "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1" 2>/dev/null || echo JSON_ERROR
}

req() { # METHOD PATH [curl args...] -> sets $CODE and $BODY
  local method=$1 path=$2; shift 2
  CODE=$(curl -s -o "$TMP" -w '%{http_code}' -X "$method" "$BASE$path" -H 'Content-Type: application/json' "$@")
  BODY=$(cat "$TMP")
}

TODAY=$(python3 -c "from zoneinfo import ZoneInfo; from datetime import datetime; print(datetime.now(ZoneInfo('Asia/Manila')).date())")
MON=$(python3 -c "
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta
d = datetime.now(ZoneInfo('Asia/Manila')).date() + timedelta(days=1)
while d.weekday() != 0: d += timedelta(days=1)
print(d)")
TUE=$(python3 -c "from datetime import date,timedelta; print(date.fromisoformat('$MON')+timedelta(days=1))")
AGE=$(python3 -c "
from zoneinfo import ZoneInfo
from datetime import datetime, date
t = datetime.now(ZoneInfo('Asia/Manila')).date(); b = date(1996,3,14)
print(t.year-b.year-((t.month,t.day)<(b.month,b.day)))")

# 1. health
req GET /health
check "health status 200" "$CODE" 200
check "health date is Manila today" "$(jget "d['date']")" "$TODAY"

# 2. logins
req POST /auth/login -d '{"email":"juan.delacruz@email.com","password":"password123"}'
check "login Juan 200" "$CODE" 200
JTOK=$(jget "d['access_token']")
check "login Juan role patient" "$(jget "d['user']['role']")" "patient"
req POST /auth/login -d '{"email":"rina@medique.ph","password":"admin123"}'
check "login Rina 200" "$CODE" 200
RTOK=$(jget "d['access_token']")
JA="Authorization: Bearer $JTOK"
RA="Authorization: Bearer $RTOK"

# 3. /me
req GET /auth/me -H "$JA"
check "me age (born 1996-03-14)" "$(jget "d['age']")" "$AGE"
check "me initials JC" "$(jget "d['initials']")" "JC"

# 4. doctors directory
req GET /doctors
check "doctors list = 6" "$(jget "len(d)")" 6
req GET '/doctors?q=ramos'
check "q=ramos is_full true" "$(jget "d[0]['availability']['is_full']")" "True"

# 5. availability Bautista MONDAY: 8 booked, exact pattern+Maria union
req GET "/doctors/d-bautista/availability?date=$MON"
check "bautista Mon booked 8" "$(jget "d['booked']")" 8
check "bautista Mon booked indexes" \
  "$(jget "sorted(s['index'] for s in d['slots'] if s['booked'])")" \
  "[0, 1, 2, 4, 5, 7, 9, 11]"
req GET "/doctors/d-bautista/availability?date=$TUE"
check "bautista Tue open false" "$(jget "d['open']")" "False"
req GET "/doctors/d-bautista/availability?date=2020-01-01"
check "past date 422" "$CODE" 422

# 6. dayboard MONDAY (before we mutate the day)
req GET "/admin/dayboard?date=$MON" -H "$RA"
check "dayboard 200" "$CODE" 200
check "dayboard summary booked == sum(lane booked)" \
  "$(jget "d['summary']['booked'] == sum(l['booked'] for l in d['lanes'] if l['open'])")" "True"
check "dayboard cancellations_today 2" "$(jget "d['summary']['cancellations_today']")" 2
check "dayboard ramos fully booked" "$(jget "'d-ramos' in d['summary']['fully_booked_doctors']")" "True"

# 7. admin bookings MONDAY counts (seeded: 2 confirmed, 1 completed, 2 cancelled)
req GET "/admin/bookings?date=$MON&status=all" -H "$RA"
check "admin bookings all 5" "$(jget "d['counts']['all']")" 5
check "admin bookings confirmed 2" "$(jget "d['counts']['confirmed']")" 2
check "admin bookings completed 1" "$(jget "d['counts']['completed']")" 1
check "admin bookings cancelled 2" "$(jget "d['counts']['cancelled']")" 2

# 8. capacity report: Ramos fill_rate 1.0
req GET "/admin/reports/capacity?week_of=$MON" -H "$RA"
check "capacity ramos fill_rate 1.0" \
  "$(jget "[x['fill_rate'] for x in d['doctors'] if x['doctor_id']=='d-ramos'][0]")" "1.0"

# 9. book Bautista MONDAY slot 3 as Juan -> 201 position 4
req POST /bookings -H "$JA" -d "{\"doctor_id\":\"d-bautista\",\"date\":\"$MON\",\"slot_index\":3,\"mode\":\"onsite\"}"
check "book slot 3 -> 201" "$CODE" 201
check "book slot 3 position 4" "$(jget "d['position']")" 4
BID=$(jget "d['id']")

# 10. availability now 9, slot 3 booked
req GET "/doctors/d-bautista/availability?date=$MON"
check "after booking booked 9" "$(jget "d['booked']")" 9
check "after booking slot 3 booked" "$(jget "[s['booked'] for s in d['slots'] if s['index']==3][0]")" "True"

# 11. same booking again -> 409
req POST /bookings -H "$JA" -d "{\"doctor_id\":\"d-bautista\",\"date\":\"$MON\",\"slot_index\":3,\"mode\":\"onsite\"}"
check "duplicate booking 409" "$CODE" 409

# 12. cancel -> slot freed
req POST "/bookings/$BID/cancel" -H "$JA"
check "cancel 200" "$CODE" 200
check "cancel status cancelled" "$(jget "d['status']")" "cancelled"
req GET "/doctors/d-bautista/availability?date=$MON"
check "after cancel booked back to 8" "$(jget "d['booked']")" 8

# 13. /mine shape
req GET /bookings/mine -H "$JA"
check "mine has upcoming/past/counts" "$(jget "sorted(d.keys())")" "['counts', 'past', 'upcoming']"
check "mine cancelled booking in past" \
  "$(jget "any(b['id']=='$BID' and b['status']=='cancelled' for b in d['past'])")" "True"
check "mine items carry doctor_id+color" \
  "$(jget "'doctor_id' in d['past'][0] and 'color' in d['past'][0]")" "True"

# 14. Ramos fully booked -> 409
req POST /bookings -H "$JA" -d "{\"doctor_id\":\"d-ramos\",\"date\":\"$MON\",\"slot_index\":5,\"mode\":\"onsite\"}"
check "ramos fully booked 409" "$CODE" 409
check "ramos fully booked message" "$(jget "d['detail']")" "Fully booked for this date — please pick another day."

# 15. register with role admin in body -> created as patient
EMAIL="smoke$(date +%s)@email.com"
req POST /auth/register -d "{\"full_name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"mobile\":\"0917-000-0000\",\"password\":\"secret6\",\"role\":\"admin\"}"
check "register 201" "$CODE" 201
check "register role ignored -> patient" "$(jget "d['user']['role']")" "patient"

# 16. admin ping guard
req GET /admin/ping
check "ping no token 401" "$CODE" 401
req GET /admin/ping -H "$JA"
check "ping Juan 403" "$CODE" 403
check "ping Juan message" "$(jget "d['detail']")" "Admin access required."
req GET /admin/ping -H "$RA"
check "ping Rina 200" "$CODE" 200
check "ping Rina name" "$(jget "d['admin']")" "Rina Domingo"

# 17. specialty create -> 11 total
req POST /admin/specialties -H "$RA" -d '{"name":"Ophthalmology","icon":"eye"}'
check "create specialty 201" "$CODE" 201
check "specialty slug" "$(jget "d['id']")" "ophthalmology"
req GET /specialties
check "specialties now 11" "$(jget "len(d)")" 11

# 18. create doctor with new specialty, then hard-delete (zero bookings)
req POST /admin/doctors -H "$RA" -d '{"name":"Dr. Elena Santos","specialty_id":"ophthalmology","room":"512","floor":"5th floor","days":["Mon","Wed","Fri"],"start_min":540,"slot_limit":12,"modes":["onsite"],"bio":"Eye care."}'
check "create doctor 201" "$CODE" 201
check "doctor slug d-santos" "$(jget "d['id']")" "d-santos"
check "doctor schedule derived" "$(jget "d['schedule_text']")" "Mon · Wed · Fri, 9:00 AM–12:00 PM"
req DELETE /admin/doctors/d-santos -H "$RA"
check "delete unbooked doctor 200" "$CODE" 200

# 19. deactivate Cruz: public list 5, booking blocked 422, reactivate -> 6
req POST /admin/doctors/d-cruz/deactivate -H "$RA"
check "deactivate cruz 200" "$CODE" 200
req GET /doctors
check "public doctors now 5" "$(jget "len(d)")" 5
req POST /bookings -H "$JA" -d "{\"doctor_id\":\"d-cruz\",\"date\":\"$TUE\",\"slot_index\":3,\"mode\":\"onsite\"}"
check "book deactivated cruz 422" "$CODE" 422
check "book deactivated cruz message" "$(jget "d['detail']")" "This doctor is not currently accepting bookings."
req POST /admin/doctors/d-cruz/activate -H "$RA"
req GET /doctors
check "public doctors back to 6" "$(jget "len(d)")" 6

# 20. contact stub
req POST /contact -d '{"name":"Ana Reyes","email":"ana@email.com","message":"Do I need a referral?"}'
check "contact 200" "$CODE" 200
check "contact personalized" "$(jget "d['message']")" "Thanks, Ana. Our team will get back to you within one business day."
req POST /contact -d '{"name":"","email":"ana@email.com","message":"hi"}'
check "contact empty name 422" "$CODE" 422
check "contact empty name message" "$(jget "d['detail']")" "Please enter your name."

echo
echo "passed $PASS, failed $FAIL"
[ "$FAIL" -eq 0 ]
