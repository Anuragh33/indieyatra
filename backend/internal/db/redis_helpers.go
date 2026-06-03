package db

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// SeatLock holds a seat for 5 minutes during checkout
type SeatLock struct {
	UserID     string
	ScheduleID string
	SeatIDs    []string
	ExpiresAt  time.Time
}

// LockSeat — SET key value NX EX 300 (5 min)
func LockSeat(ctx context.Context, scheduleID, userID, seatID string) error {
	key := fmt.Sprintf("seatlock:%s:%s", scheduleID, seatID)
	return RDB.SetNX(ctx, key, userID, 5*time.Minute).Err()
}

func IsSeatLocked(ctx context.Context, scheduleID, seatID string) (string, bool, error) {
	key := fmt.Sprintf("seatlock:%s:%s", scheduleID, seatID)
	val, err := RDB.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return val, true, nil
}

func ReleaseSeat(ctx context.Context, scheduleID, seatID string) error {
	key := fmt.Sprintf("seatlock:%s:%s", scheduleID, seatID)
	return RDB.Del(ctx, key).Err()
}

func ReleaseAllUserLocks(ctx context.Context, scheduleID, userID string, seatIDs []string) error {
	keys := make([]string, len(seatIDs))
	for i, sid := range seatIDs {
		keys[i] = fmt.Sprintf("seatlock:%s:%s", scheduleID, sid)
	}
	return RDB.Del(ctx, keys...).Err()
}

// CacheSearch — simple search result cache (60s TTL)
func CacheSearch(ctx context.Context, key string, value string) error {
	return RDB.Set(ctx, "search:"+key, value, 60*time.Second).Err()
}

func GetCachedSearch(ctx context.Context, key string) (string, error) {
	val, err := RDB.Get(ctx, "search:"+key).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

// Session helpers
func SetSession(ctx context.Context, userID, token string) error {
	return RDB.Set(ctx, "session:"+userID, token, 7*24*time.Hour).Err()
}

func GetSession(ctx context.Context, userID string) (string, error) {
	val, err := RDB.Get(ctx, "session:" + userID).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}
