package handlers

import (
	"assignments-wills0ng/servers/gateway/models/users"
	"time"
)

type SessionState struct {
	StartTime time.Time   `json:"startTime"`
	User      *users.User `json:"user"`
}
