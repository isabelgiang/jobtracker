package handlers

import (
	"assignments-wills0ng/servers/gateway/models/users"
	"assignments-wills0ng/servers/gateway/sessions"
)

//TODO: define a handler context struct that
//will be a receiver on any of your HTTP
//handler functions that need access to
//globals, such as the key used for signing
//and verifying SessionIDs, the session store
//and the user store

type HandlerContext struct {
	SigningKey   string
	SessionStore sessions.Store
	UserStore    users.Store
}
