package handlers

import "net/http"

const originCORS = "Access-Control-Allow-Origin"          // Defines origins with responses can be shared
const allowMethodsCORS = "Access-Control-Allow-Methods"   // Defines allowed HTTP methods
const allowHeadersCORS = "Access-Control-Allow-Headers"   // Defines allowed non-simple headers
const exposeHeadersCORS = "Access-Control-Expose-Headers" // Defines which headers clients can access
const maxAgeCORS = "Access-Control-Max-Age"               // Defines maximum seconds browser is allowed to cache response

//HandlerCORS is a middleware handler that responds to all requests
//with specific CORS HTTP headers
type HandlerCORS struct {
	handler http.Handler
}

//ServeHTTP handles the requests by attaching the appropriate headers to
//the given requests
func (hc *HandlerCORS) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(originCORS, "*")
	w.Header().Add(allowMethodsCORS, "GET, PUT, POST, PATCH, DELETE")
	w.Header().Add(exposeHeadersCORS, "Authorization")
	w.Header().Add(allowHeadersCORS, "Content-Type, Authorization")
	w.Header().Add(maxAgeCORS, "600")
	// Handle preflighr requests for cross-origin requests that aren't "simple" requests
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
	}
	hc.handler.ServeHTTP(w, r)
}

//NewHandlerCORS creates new CORS middleware handler
func NewHandlerCORS(handlerToWrap http.Handler) *HandlerCORS {
	return &HandlerCORS{handler: handlerToWrap}
}
