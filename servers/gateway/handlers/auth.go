package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"assignments-wills0ng/servers/gateway/models/users"
	"assignments-wills0ng/servers/gateway/sessions"
)

//TODO: define HTTP handler functions as described in the
//assignment description. Remember to use your handler context
//struct as the receiver on these functions so that you have
//access to things like the session store and user store.

const headerContentType = "Content-Type"
const contentTypeJson = "application/json"

//UsersHandler handles requests for the "users" resource.
func (ctx *HandlerContext) UsersHandler(w http.ResponseWriter, r *http.Request) {
	//Validate that request is using POST method
	if r.Method != http.MethodPost {
		http.Error(w, "only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}
	//Validate that request content type is JSON
	contentType := r.Header.Get(headerContentType)
	if !strings.HasPrefix(contentType, contentTypeJson) {
		http.Error(w, "request body must be in JSON", http.StatusUnsupportedMediaType)
		return
	}
	//Read request body and decode JSON into NewUser
	requestBody := r.Body
	defer requestBody.Close()

	nu := &users.NewUser{}
	jsonDecoder := json.NewDecoder(requestBody)
	err := jsonDecoder.Decode(nu)
	if err != nil {
		http.Error(w, "error decoding user data", http.StatusBadRequest)
		return
	}
	//Validate user
	u, err := nu.ToUser()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	//Check if user already exists
	existingUser, _ := ctx.UserStore.GetByEmail(u.Email)
	if existingUser != nil {
		http.Error(w, "this email address has already been used", http.StatusBadRequest)
		return
	}
	existingUser, _ = ctx.UserStore.GetByUserName(u.UserName)
	if existingUser != nil {
		http.Error(w, "this username has already been used", http.StatusBadRequest)
		return
	}
	//Create new record in user store
	u, err = ctx.UserStore.Insert(u)
	if err != nil {
		http.Error(w, fmt.Sprintf("there was an error creating your account: %s", err.Error()), http.StatusInternalServerError)
		return
	}
	//Start new session
	sessionState := &SessionState{
		StartTime: time.Now(),
		User:      u,
	}
	_, err = sessions.BeginSession(ctx.SigningKey, ctx.SessionStore, sessionState, w)
	if err != nil {
		http.Error(w, fmt.Sprintf("sorry, there was an error beginning your session: %s", err.Error()), http.StatusInternalServerError)
		return
	}
	//Respond to client
	response, err := json.Marshal(u)
	if err != nil {
		http.Error(w, fmt.Sprintf("sorry, there was an unknown error: %s", err.Error()), http.StatusInternalServerError)
		return
	}
	w.Header().Set(headerContentType, contentTypeJson)
	w.WriteHeader(http.StatusCreated)
	w.Write(response)
}

//SpecificUserHandler handles requests for a specific user.
func (ctx *HandlerContext) SpecificUserHandler(w http.ResponseWriter, r *http.Request) {
	//Check if user is authenticated by checking if a session is active
	sessionState := &SessionState{}
	_, err := sessions.GetState(r, ctx.SigningKey, ctx.SessionStore, sessionState)
	if err != nil {
		http.Error(w, "not authorized", http.StatusUnauthorized)
		return
	}
	currentUser := sessionState.User

	//Parse user ID from request URL
	//If the user requested in the path is "me"
	//then set id as the currently authenticated user
	userPath := path.Base(r.URL.Path)
	var requestedUserID int64
	if userPath == "me" {
		requestedUserID = currentUser.ID
	} else {
		requestedUserID, err = strconv.ParseInt(userPath, 10, 64)
		if err != nil {
			http.Error(w, "invalid resource path", http.StatusBadRequest)
			return
		}
	}

	//Handle GET requests
	if r.Method == http.MethodGet {
		requestedUser, err := ctx.UserStore.GetByID(requestedUserID)
		if err != nil {
			//TODO: need more specific error checking to handle UserNotExist vs DB error
			http.Error(w, "this user does not exist", http.StatusNotFound)
			return
		}

		//Respond to client
		response, err := json.Marshal(requestedUser)
		if err != nil {
			http.Error(w, "unexpected error", http.StatusInternalServerError)
			return
		}
		w.Header().Set(headerContentType, contentTypeJson)
		w.WriteHeader(http.StatusOK)
		w.Write(response)

		//Handle PATCH requests
	} else if r.Method == http.MethodPatch {
		//Check if user is authorized
		if userPath != "me" && requestedUserID != currentUser.ID {
			http.Error(w, "you are not authorized to take this action", http.StatusForbidden)
			return
		}

		//Validate that request content type is JSON
		contentType := r.Header.Get(headerContentType)
		if !strings.HasPrefix(contentType, contentTypeJson) {
			http.Error(w, "request body must be in JSON", http.StatusUnsupportedMediaType)
			return
		}

		//Read request body and decode JSON into Updates
		requestBody := r.Body
		defer requestBody.Close()
		updates := &users.Updates{}
		jsonDecoder := json.NewDecoder(requestBody)
		jsonDecoder.Decode(updates)

		//Update user store with requested updates
		currentUser, err := ctx.UserStore.Update(requestedUserID, updates)
		if err != nil {
			http.Error(w, "error updating the user profile", http.StatusBadRequest)
			return
		}

		//Respond to client
		response, err := json.Marshal(currentUser)
		if err != nil {
			http.Error(w, "unexpected error", http.StatusInternalServerError)
			return
		}
		w.Header().Set(headerContentType, contentTypeJson)
		w.WriteHeader(http.StatusOK)
		w.Write(response)

		// Return error for other request types
	} else {
		http.Error(w, "request method not allowed", http.StatusMethodNotAllowed)
		return
	}
}

//SessionsHandler handles requests to create a new session using a user's credentials
func (ctx *HandlerContext) SessionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		contentType := r.Header.Get(headerContentType)
		if contentType != contentTypeJson {
			http.Error(w, fmt.Sprintf("%v must be %v", headerContentType, contentTypeJson), http.StatusUnsupportedMediaType)
			return
		}

		// Unmarshal user credentials
		decoder := json.NewDecoder(r.Body)
		cred := &users.Credentials{}
		if err := decoder.Decode(cred); err != nil {
			http.Error(w, fmt.Sprintf("error decoding credentials: %v", err), http.StatusBadRequest)
			return
		}

		// Get the user that matches with the given email
		user, err := ctx.UserStore.GetByEmail(cred.Email)
		if err != nil {
			// Sleep for 800 ms to match bcrypt authentication delay
			time.Sleep(800 * time.Millisecond)
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		// Authenticate user with the given password
		err = user.Authenticate(cred.Password)
		if err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		// Create new session
		sessionState := &SessionState{
			StartTime: time.Now(),
			User:      user,
		}

		_, err = sessions.BeginSession(ctx.SigningKey, ctx.SessionStore, sessionState, w)
		if err != nil {
			http.Error(w, fmt.Sprintf("unexpected error beginning session: %v", err), http.StatusInternalServerError)
			return
		}

		// Log when and how a user signs in
		userIP := r.RemoteAddr
		// Use first IP address in the list if X-Forwarded-For header is included
		headerIP := r.Header.Get("X-Forwarded-For")
		if len(headerIP) != 0 {
			userIP = headerIP
		}

		signIn := users.UserSignIn{
			ID:         int64(0),
			UserID:     user.ID,
			SignInTime: time.Now(),
			IP:         userIP,
		}
		ctx.UserStore.LogSignIn(&signIn)

		// Respond with copy of user profile
		w.Header().Set(headerContentType, contentTypeJson)

		w.WriteHeader(http.StatusCreated)
		if err := json.NewEncoder(w).Encode(user); err != nil {
			http.Error(w, fmt.Sprintf("unexpected error encoding response to JSON: %v", err), http.StatusInternalServerError)
			return
		}
		// Return status code 201 to indicate a new response was created
	} else {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}
}

//SpecificSessionHandler handles requests related to a specific user's authenticated session
func (ctx *HandlerContext) SpecificSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodDelete {
		if path.Base(r.URL.Path) != "mine" {
			http.Error(w, "unauthorized to delete current session", http.StatusForbidden)
			return
		}
		_, err := sessions.EndSession(r, ctx.SigningKey, ctx.SessionStore)
		if err != nil {
			http.Error(w, fmt.Sprintf("unexpected error ending session: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("signed out"))
	} else {
		http.Error(w, "Only DELETE method is allowed", http.StatusMethodNotAllowed)
		return
	}
}
