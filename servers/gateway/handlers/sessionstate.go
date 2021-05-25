package handlers

import (
	"JobTracker/servers/gateway/models/users"
	"time"
)

type SessionState struct {
	StartTime time.Time   `json:"startTime"`
	User      *users.User `json:"user"`
}
