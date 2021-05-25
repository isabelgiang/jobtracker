package main

import (
	"assignments-wills0ng/servers/summary/handlers"
	"log"
	"net/http"
)

// main is the main entry point for the server
func main() {
	// All requests to this microservice will go through a gateway, so this server only needs to support HTTP requests
	const addr = ":80"

	// Create mux and handle endpoints
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/summary", handlers.SummaryHandler)

	// Listen and serve TLS traffic
	log.Printf("server is listening at %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
