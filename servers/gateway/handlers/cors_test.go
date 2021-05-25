package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS(t *testing.T) {
	dummyHandler := http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {},
	)
	response := httptest.NewRecorder()
	middleware := NewHandlerCORS(dummyHandler)
	request, err := http.NewRequest("GET", "/v1/users", nil)
	if err != nil {
		t.Errorf("unexpected error with request: %v", err)
	}
	middleware.ServeHTTP(response, request)

	if header := response.Header().Get(originCORS); header != "*" {
		t.Errorf("%v set incorrectly: %v", originCORS, header)
	}
	if header := response.Header().Get(allowMethodsCORS); header != "GET, PUT, POST, PATCH, DELETE" {
		t.Errorf("%v set incorrectly: %v", allowMethodsCORS, header)
	}
	if header := response.Header().Get(allowHeadersCORS); header != "Content-Type, Authorization" {
		t.Errorf("%v set incorrectly: %v", allowHeadersCORS, header)
	}
	if header := response.Header().Get(exposeHeadersCORS); header != "Authorization" {
		t.Errorf("%v set incorrectly: %v", exposeHeadersCORS, header)
	}
	if header := response.Header().Get(maxAgeCORS); header != "600" {
		t.Errorf("%v set incorrectly: %v", maxAgeCORS, header)
	}
}
