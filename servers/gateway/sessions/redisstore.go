package sessions

import (
	"context"
	"encoding/json"
	"time"

	"github.com/go-redis/redis/v8"
)

// TODO: figureout correct context
var ctx = context.TODO()

//RedisStore represents a session.Store backed by redis.
type RedisStore struct {
	//Redis client used to talk to redis server.
	Client *redis.Client
	//Used for key expiry time on redis.
	SessionDuration time.Duration
}

//NewRedisStore constructs a new RedisStore
func NewRedisStore(client *redis.Client, sessionDuration time.Duration) *RedisStore {
	//initialize and return a new RedisStore struct
	return &RedisStore{
		Client:          client,
		SessionDuration: sessionDuration,
	}
}

//Store implementation

//Save saves the provided `sessionState` and associated SessionID to the store.
//The `sessionState` parameter is typically a pointer to a struct containing
//all the data you want to associated with the given SessionID.
func (rs *RedisStore) Save(sid SessionID, sessionState interface{}) error {
	sessionStateJSON, err := json.Marshal(sessionState)
	if err != nil {
		return err
	}
	err = rs.Client.Set(ctx, sid.getRedisKey(), sessionStateJSON, rs.SessionDuration).Err()
	if err != nil {
		return err
	}
	return nil
}

//Get populates `sessionState` with the data previously saved
//for the given SessionID
func (rs *RedisStore) Get(sid SessionID, sessionState interface{}) error {
	pipe := rs.Client.Pipeline()

	get := pipe.Get(ctx, sid.getRedisKey())
	pipe.Expire(ctx, sid.getRedisKey(), rs.SessionDuration)

	_, err := pipe.Exec(ctx)
	switch {
	case err == redis.Nil:
		return ErrStateNotFound
	case err != nil:
		return err
	}
	// value is available only after Exec
	storedState := get.Val()
	return json.Unmarshal([]byte(storedState), sessionState)
}

//Delete deletes all state data associated with the SessionID from the store.
func (rs *RedisStore) Delete(sid SessionID) error {
	return rs.Client.Del(ctx, sid.getRedisKey()).Err()
}

//getRedisKey() returns the redis key to use for the SessionID
func (sid SessionID) getRedisKey() string {
	//convert the SessionID to a string and add the prefix "sid:" to keep
	//SessionID keys separate from other keys that might end up in this
	//redis instance
	return "sid:" + sid.String()
}
