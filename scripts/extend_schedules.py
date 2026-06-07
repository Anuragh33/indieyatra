#!/usr/bin/env python3
"""
IndieYatra schedule extender.
Run daily via cron. Extends bus, flight, and train schedules
by 90 days whenever the current window is within 30 days of running out.

Cron entry (runs daily at 2am):
  0 2 * * * /path/to/python3 /path/to/extend_schedules.py >> /var/log/indieyatra_schedules.log 2>&1
"""

import os, sys, uuid, json, math, random
from datetime import datetime, timedelta, date
import psycopg2
from psycopg2.extras import execute_values

# ── Config ────────────────────────────────────────────────────────────────────
ENV_FILE    = os.path.expanduser("~/Developer/indieyatra/backend/.env")
EXTEND_DAYS = 30   # how many days to generate when extending
BUFFER_DAYS = 7    # start extending when less than this many days remain

# ── DB connection ─────────────────────────────────────────────────────────────
with open(ENV_FILE) as f:
    db_url = next(l.split("=",1)[1].strip().strip('"') for l in f if l.strip().startswith("DATABASE_URL="))

conn = psycopg2.connect(db_url)
conn.autocommit = False
cur  = conn.cursor()
now  = datetime.utcnow()
today = date.today()

def uid(): return str(uuid.uuid4())
def log(msg): print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

# ── 1. BUS SCHEDULES ──────────────────────────────────────────────────────────
def extend_bus_schedules():
    cur.execute("SELECT MAX(departure_at)::date FROM schedules WHERE deleted_at IS NULL")
    row = cur.fetchone()
    max_date = row[0] if row and row[0] else today

    days_remaining = (max_date - today).days
    if days_remaining >= BUFFER_DAYS:
        log(f"Bus schedules OK — covered through {max_date} ({days_remaining} days remaining)")
        return 0

    log(f"Bus schedules low — {days_remaining} days left, extending {EXTEND_DAYS} days from {max_date}...")

    # Load route→bus→operator→fare data (one schedule per route/bus combo)
    cur.execute("""
        SELECT DISTINCT ON (s.route_id, s.bus_id)
            s.route_id, s.bus_id, s.operator_id,
            EXTRACT(HOUR FROM s.departure_at)::int   AS dep_h,
            EXTRACT(MINUTE FROM s.departure_at)::int AS dep_m,
            s.duration_min, s.base_fare, s.seats_total, s.is_active
        FROM schedules s
        WHERE s.deleted_at IS NULL
        ORDER BY s.route_id, s.bus_id, s.departure_at ASC
    """)
    templates = cur.fetchall()
    if not templates:
        log("No bus schedule templates found")
        return 0

    start = max_date + timedelta(days=1)
    rows = []
    for route_id, bus_id, op_id, dep_h, dep_m, dur, fare, seats, active in templates:
        for d in range(EXTEND_DAYS):
            dep = datetime(start.year, start.month, start.day, dep_h, dep_m) + timedelta(days=d)
            arr = dep + timedelta(minutes=int(dur))
            rows.append((uid(), now, now, route_id, bus_id, op_id, dep, arr,
                         int(dur), 0, float(fare), "INR", int(seats), int(seats), active))

        if len(rows) >= 20000:
            execute_values(cur, """
                INSERT INTO schedules
                  (id,created_at,updated_at,route_id,bus_id,operator_id,
                   departure_at,arrival_at,duration_min,stops,
                   base_fare,currency,seats_total,seats_available,is_active)
                VALUES %s
            """, rows, page_size=1000)
            conn.commit()
            rows = []

    if rows:
        execute_values(cur, """
            INSERT INTO schedules
              (id,created_at,updated_at,route_id,bus_id,operator_id,
               departure_at,arrival_at,duration_min,stops,
               base_fare,currency,seats_total,seats_available,is_active)
            VALUES %s
        """, rows, page_size=1000)
        conn.commit()

    cur.execute("SELECT MAX(departure_at)::date FROM schedules WHERE deleted_at IS NULL")
    new_max = cur.fetchone()[0]
    log(f"Bus schedules extended through {new_max}")
    return EXTEND_DAYS

# ── 2. FLIGHT SCHEDULES ───────────────────────────────────────────────────────
def extend_flight_schedules():
    cur.execute("SELECT MAX(journey_date)::date FROM flight_schedules WHERE deleted_at IS NULL AND is_active = true")
    row = cur.fetchone()
    max_date = row[0] if row and row[0] else today

    days_remaining = (max_date - today).days
    if days_remaining >= BUFFER_DAYS:
        log(f"Flight schedules OK — covered through {max_date} ({days_remaining} days remaining)")
        return 0

    log(f"Flight schedules low — {days_remaining} days left, extending {EXTEND_DAYS} days...")

    # Load one template per flight_number (airline + route + time)
    cur.execute("""
        SELECT DISTINCT ON (airline_id, from_airport_id, to_airport_id, departure_time, cabin_class)
            flight_number, airline_id, from_airport_id, to_airport_id,
            departure_time, arrival_time, duration_min, aircraft, cabin_class,
            total_seats, base_fare, taxes_and_fees, baggage_kg,
            has_meal, has_wifi, has_usb, on_time_percent, fare_type, refund_policy
        FROM flight_schedules
        WHERE deleted_at IS NULL AND is_active = true
        ORDER BY airline_id, from_airport_id, to_airport_id, departure_time, cabin_class,
                 journey_date DESC
    """)
    templates = cur.fetchall()
    if not templates:
        log("No flight schedule templates found")
        return 0

    # Get existing (flight_number, journey_date) pairs to avoid duplicates
    cur.execute("SELECT flight_number, journey_date::date FROM flight_schedules WHERE deleted_at IS NULL")
    existing = {(r[0], r[1]) for r in cur.fetchall()}

    start = max_date + timedelta(days=1)
    rows = []
    for (flight_num, al_id, from_id, to_id, dep_t, arr_t, dur, aircraft,
         cabin, seats, fare, taxes, baggage, meal, wifi, usb, otp, fare_type, refund) in templates:

        # Strip old date suffix if present (e.g. "6E-204-20260101" → "6E-204")
        base_num = flight_num.rsplit("-", 1)[0] if flight_num.count("-") >= 2 else flight_num

        for d in range(EXTEND_DAYS):
            journey = start + timedelta(days=d)
            new_flight_num = f"{base_num}-{journey.strftime('%Y%m%d')}"
            if (new_flight_num, journey) in existing:
                continue
            existing.add((new_flight_num, journey))
            avail = max(0, int(seats) - random.randint(0, 30))
            rows.append((
                uid(), now, now, new_flight_num, al_id, from_id, to_id,
                datetime(journey.year, journey.month, journey.day),
                dep_t, arr_t, int(dur), aircraft, cabin,
                int(seats), avail, float(fare), float(taxes),
                int(baggage or 15), bool(meal), bool(wifi), bool(usb),
                int(otp or 85), fare_type, refund, True
            ))

        if len(rows) >= 10000:
            execute_values(cur, """
                INSERT INTO flight_schedules
                  (id,created_at,updated_at,flight_number,airline_id,from_airport_id,to_airport_id,
                   journey_date,departure_time,arrival_time,duration_min,aircraft,cabin_class,
                   total_seats,available_seats,base_fare,taxes_and_fees,baggage_kg,
                   has_meal,has_wifi,has_usb,on_time_percent,fare_type,refund_policy,is_active)
                VALUES %s
            """, rows, page_size=500)
            conn.commit()
            rows = []

    if rows:
        execute_values(cur, """
            INSERT INTO flight_schedules
              (id,created_at,updated_at,flight_number,airline_id,from_airport_id,to_airport_id,
               journey_date,departure_time,arrival_time,duration_min,aircraft,cabin_class,
               total_seats,available_seats,base_fare,taxes_and_fees,baggage_kg,
               has_meal,has_wifi,has_usb,on_time_percent,fare_type,refund_policy,is_active)
            VALUES %s
        """, rows, page_size=500)
        conn.commit()

    cur.execute("SELECT MAX(journey_date)::date FROM flight_schedules WHERE deleted_at IS NULL")
    new_max = cur.fetchone()[0]
    log(f"Flight schedules extended through {new_max}")
    return EXTEND_DAYS

# ── 3. TRAIN SCHEDULES ────────────────────────────────────────────────────────
CLASS_FARES = {
    "1A": 4.5, "2A": 2.8, "3A": 1.9,
    "SL": 0.7, "CC": 1.4, "EC": 2.2, "2S": 0.4,
}

def extend_train_schedules():
    cur.execute("SELECT MAX(journey_date)::date FROM train_schedules WHERE deleted_at IS NULL AND is_active = true")
    row = cur.fetchone()
    max_date = row[0] if row and row[0] else today

    days_remaining = (max_date - today).days
    if days_remaining >= BUFFER_DAYS:
        log(f"Train schedules OK — covered through {max_date} ({days_remaining} days remaining)")
        return 0

    log(f"Train schedules low — {days_remaining} days left, extending {EXTEND_DAYS} days...")

    # Load one template per train (from_station, to_station, times, duration)
    cur.execute("""
        SELECT DISTINCT ON (train_id)
            train_id, from_station_id, to_station_id,
            departure_time, arrival_time, arrival_day, duration_min
        FROM train_schedules
        WHERE deleted_at IS NULL AND is_active = true
        ORDER BY train_id, journey_date DESC
    """)
    templates = cur.fetchall()
    if not templates:
        log("No train schedule templates — nothing to extend")
        return 0

    # Load class availabilities as template (one per schedule as reference)
    cur.execute("""
        SELECT DISTINCT ON (ts.train_id, tca.class)
            ts.train_id, tca.class, tca.total_berths, tca.base_fare, tca.tatkal_fare
        FROM train_schedules ts
        JOIN train_class_availabilities tca ON tca.schedule_id = ts.id
        WHERE ts.deleted_at IS NULL AND tca.deleted_at IS NULL
        ORDER BY ts.train_id, tca.class, ts.journey_date DESC
    """)
    class_templates = {}
    for train_id, cls, berths, fare, tatkal in cur.fetchall():
        if train_id not in class_templates:
            class_templates[train_id] = []
        class_templates[train_id].append((cls, int(berths), float(fare), float(tatkal)))

    start = max_date + timedelta(days=1)
    sched_rows = []
    avail_rows = []
    total = 0

    for train_id, from_st, to_st, dep_t, arr_t, arr_day, dur in templates:
        classes = class_templates.get(train_id, [("SL", 72, 500, 650)])

        for d in range(EXTEND_DAYS):
            journey = datetime(start.year, start.month, start.day) + timedelta(days=d)
            sid = uid()
            sched_rows.append((
                sid, now, now,
                train_id, from_st, to_st,
                journey, dep_t, arr_t,
                int(arr_day or 1), int(dur or 120), True
            ))

            for cls, berths, base_fare, tatkal_fare in classes:
                avail = berths - random.randint(0, min(10, berths // 4))
                avail_rows.append((
                    uid(), now, now, sid, cls,
                    berths, avail, 0, 0,
                    base_fare, tatkal_fare, "AVAILABLE"
                ))

        if len(sched_rows) >= 5000:
            execute_values(cur, """
                INSERT INTO train_schedules
                  (id,created_at,updated_at,train_id,from_station_id,to_station_id,
                   journey_date,departure_time,arrival_time,arrival_day,duration_min,is_active)
                VALUES %s
            """, sched_rows, page_size=500)
            execute_values(cur, """
                INSERT INTO train_class_availabilities
                  (id,created_at,updated_at,schedule_id,class,
                   total_berths,available,rac,waitlist_count,
                   base_fare,tatkal_fare,status)
                VALUES %s
            """, avail_rows, page_size=500)
            conn.commit()
            total += len(sched_rows)
            sched_rows = []
            avail_rows = []

    if sched_rows:
        execute_values(cur, """
            INSERT INTO train_schedules
              (id,created_at,updated_at,train_id,from_station_id,to_station_id,
               journey_date,departure_time,arrival_time,arrival_day,duration_min,is_active)
            VALUES %s
        """, sched_rows, page_size=500)
        execute_values(cur, """
            INSERT INTO train_class_availabilities
              (id,created_at,updated_at,schedule_id,class,
               total_berths,available,rac,waitlist_count,
               base_fare,tatkal_fare,status)
            VALUES %s
        """, avail_rows, page_size=500)
        conn.commit()
        total += len(sched_rows)

    cur.execute("SELECT MAX(journey_date)::date FROM train_schedules WHERE deleted_at IS NULL")
    new_max = cur.fetchone()[0]
    log(f"Train schedules extended through {new_max} (+{total} schedules)")
    return total

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log("=== IndieYatra schedule extender starting ===")
    try:
        extend_bus_schedules()
        extend_flight_schedules()
        extend_train_schedules()
        log("=== Done ===")
    except Exception as e:
        log(f"ERROR: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()
