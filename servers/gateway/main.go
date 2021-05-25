package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"assignments-wills0ng/servers/gateway/handlers"
	"assignments-wills0ng/servers/gateway/models/users"
	"assignments-wills0ng/servers/gateway/sessions"

	"github.com/go-redis/redis/v8"
)

// Director is the director used for routing to microservices
type Director func(r *http.Request)

// CustomDirector forwards to the microservice and passes it the current user.
// Returns a Director function required by httputil.ReverseProxy
func CustomDirector(targets []*url.URL, ctx *handlers.HandlerContext) Director {
	// Create variables used across ReverseProxy requests for a given microservice
	// counter keeps track of which target host to send traffic to next
	// mutex manages mutually exclusive locks for data structures
	counter := int32(0)
	mutex := sync.Mutex{}

	// Return Director function
	return func(r *http.Request) {
		// Obtain exclusive lock for the request
		mutex.Lock()
		defer mutex.Unlock()

		// Delete original X-User to prevent spoofed user
		// from being passed to the target host
		r.Header.Del("X-User")

		// Authenticate user based on handler context
		sessionState := &handlers.SessionState{}
		_, err := sessions.GetState(r, ctx.SigningKey, ctx.SessionStore, sessionState)

		// Pass the authenticated user info to the microservice
		// If there is an error, forward it to the API to deal with it.
		if err != nil {
			r.Header.Add("X-User", "{}")
		} else {
			user := sessionState.User
			userJSON, err := json.Marshal(user)
			if err != nil {
				r.Header.Add("X-User", "{}")
			} else {
				r.Header.Add("X-User", string(userJSON))
			}
		}

		// Choose target host round-robin
		targ := targets[counter%int32(len(targets))]
		atomic.AddInt32(&counter, 1)

		// Add X-Forwarded-Host to identify original host requested by client
		r.Header.Add("X-Forwarded-Host", r.Host)

		// Replace original request's Host/URL info with target host info
		r.Host = targ.Host
		r.URL.Host = targ.Host
		r.URL.Scheme = targ.Scheme
	}
}

// getURLs parses a comma-delimited list of network addresses where microservice instances are listening
func getURLs(addrString string) []*url.URL {
	addrsSplit := strings.Split(addrString, ",")
	URLs := make([]*url.URL, len(addrsSplit))
	for i, c := range addrsSplit {
		URL, err := url.Parse(c)
		if err != nil {
			log.Fatal(fmt.Printf("Failure to parse url %v", err))
		}
		URLs[i] = URL
	}
	return URLs
}

// main is the main entry point for the server
func main() {
	// Serve TLS traffic at port :443
	const addr = ":443"

	// Define map of enviroment variable names to values
	env := map[string]string{}
	envVars := []string{
		"TLSCERT",           // Path of TLS certificate
		"TLSKEY",            // Path of TLS certificate
		"REDISADDR",         // Address for Redis session store
		"SESSIONKEY",        // Key for signing and validating session IDs
		"DSN",               // Data source name to pass to SQL connection
		"POSTGRES_PASSWORD", // Password for Postgres user store
		"MESSAGESADDR",      // Comma-delimited list of network addresses where the messaging microservice instances are listening
		"SUMMARYADDR",       // Comma-delimited list of network addresses where the page summary microservice instances are listening
	}
	// These are all required, so check that they are set correctly
	for _, v := range envVars {
		env[v] = os.Getenv(v)
		if len(env[v]) == 0 {
			log.Printf("Environment variable %s is empty", v)
			os.Exit(1)
		}
	}

	// Create user store
	db, err := sql.Open("postgres", fmt.Sprintf(env["DSN"], env["POSTGRES_PASSWORD"]))
	if err != nil {
		log.Fatalf("unexpected error opening database connection: %v", err)
	}
	defer db.Close()
	usersStore, err := users.NewPostgresStore(db)
	if err != nil {
		log.Fatalf("unexpected error creating new user store: %v", err)
	}

	// Create session store
	redisClient := redis.NewClient(&redis.Options{
		Addr:     env["REDISADDR"],
		Password: "", // Use no password
		DB:       0,  // Use default DB
	})
	sessionStore := sessions.NewRedisStore(redisClient, time.Duration(30)*time.Minute)

	// Create handler context
	ctx := &handlers.HandlerContext{
		SigningKey:   env["SESSIONKEY"],
		SessionStore: sessionStore,
		UserStore:    usersStore,
	}

	// Create URLs for proxies
	messagesURLs := getURLs(env["MESSAGESADDR"])
	summaryURLs := getURLs(env["SUMMARYADDR"])

	// Create reverse proxies
	messagesProxy := &httputil.ReverseProxy{Director: CustomDirector(messagesURLs, ctx)}
	summaryProxy := &httputil.ReverseProxy{Director: CustomDirector(summaryURLs, ctx)}

	// Create mux and handle various endpoints
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/users", ctx.UsersHandler)
	mux.HandleFunc("/v1/users/", ctx.SpecificUserHandler)
	mux.HandleFunc("/v1/sessions", ctx.SessionsHandler)
	mux.HandleFunc("/v1/sessions/", ctx.SpecificSessionHandler)
	mux.Handle("/v1/channels", messagesProxy)
	mux.Handle("/v1/channels/", messagesProxy)
	mux.Handle("/v1/messages/", messagesProxy)
	mux.Handle("/v1/summary", summaryProxy)

	// Add CORS middleware
	corsMux := handlers.NewHandlerCORS(mux)

	// Listen and serve TLS traffic
	log.Printf("server is listening at %s", addr)
	log.Fatal(http.ListenAndServeTLS(addr, env["TLSCERT"], env["TLSKEY"], corsMux))
}
