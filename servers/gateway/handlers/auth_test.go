package handlers

import (
	"JobTracker/servers/gateway/models/users"
	"JobTracker/servers/gateway/sessions"
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"encoding/json"
)

func createTestUser() *users.User {
	user := &users.User{ID: 1}
	return user
}

func createTestUserWithCredentials() *users.User {
	user := createTestUser()
	user.SetPassword("testPassword")
	user.Email = "test@uw.edu"
	return user
}

func createValidNewUser() *users.NewUser {
	return &users.NewUser{
		Email:        "test@test.com",
		Password:     "password123",
		PasswordConf: "password123",
		UserName:     "test",
		FirstName:    "Testy",
		LastName:     "Testerson",
	}
}

func createInvalidNewUser() *users.NewUser {
	nu := createValidNewUser()
	nu.Password = ""
	return nu
}

func checkUserEquality(u1 *users.User, u2 *users.User) (bool, string) {
	if u1.FirstName != u2.FirstName {
		return false, fmt.Sprintf("first names are not equal: %v, %v", u1.FirstName, u2.FirstName)
	}

	if u1.LastName != u2.LastName {
		return false, fmt.Sprintf("last names are not equal: %v, %v", u1.LastName, u2.LastName)
	}

	if u1.ID != u2.ID {
		return false, fmt.Sprintf("IDs are not equal: %v, %v", u1.ID, u2.ID)
	}

	if u1.UserName != u2.UserName {
		return false, fmt.Sprintf("Usernames are not equal: %v, %v", u1.UserName, u2.UserName)
	}

	if u1.PhotoURL != u2.PhotoURL {
		return false, fmt.Sprintf("Photo URLs are not equal: %v, %v", u1.PhotoURL, u2.PhotoURL)
	}
	return true, ""
}

type UsersHandlerCase struct {
	name         string
	method       string
	contentType  string
	body         interface{}
	userStore    *users.MockStore
	signingKey   string
	expectedCode int
}

func newUsersHandlerCase() UsersHandlerCase {
	return UsersHandlerCase{
		name:         "",
		method:       http.MethodPost,
		contentType:  contentTypeJson,
		body:         createValidNewUser(),
		userStore:    users.NewMockStore(false, nil, nil),
		signingKey:   "testKey",
		expectedCode: http.StatusCreated,
	}
}

func callUsersHandler(c UsersHandlerCase, t *testing.T) {
	// Prepare request body
	var requestBody io.Reader
	updates, err := json.Marshal(c.body)
	if err != nil {
		t.Fatalf("unexpected error marshaling updates to JSON")
	}
	requestBody = bytes.NewBuffer(updates)

	// Create request
	request, err := http.NewRequest(c.method, "/v1/users", requestBody)
	if err != nil {
		t.Fatalf("unexpected error sending requests")
	}
	request.Header.Set(headerContentType, c.contentType)

	// Set up handler with context
	ctx := HandlerContext{
		SigningKey:   c.signingKey,
		SessionStore: sessions.NewMemStore(time.Hour, time.Minute),
		UserStore:    c.userStore,
	}
	handler := http.HandlerFunc(ctx.UsersHandler)

	// Serve request
	responseWriter := httptest.NewRecorder()
	handler.ServeHTTP(responseWriter, request)

	// Check return status codes
	if status := responseWriter.Code; status != c.expectedCode {
		t.Errorf("case %s: wrong status code - got %v but expected %v", c.name, status, c.expectedCode)
	}
}

func TestUserHandler(t *testing.T) {
	// Test invalid request methods
	methodCases := []struct {
		name         string
		method       string
		expectedCode int
	}{
		{
			"Invalid request method GET",
			"GET",
			http.StatusMethodNotAllowed,
		},
		{
			"Invalid request method PUT",
			"PUT",
			http.StatusMethodNotAllowed,
		},
		{
			"Invalid request method PATCH",
			"PATCH",
			http.StatusMethodNotAllowed,
		},
		{
			"Invalid request method DELETE",
			"DELETE",
			http.StatusMethodNotAllowed,
		},
	}
	for _, mc := range methodCases {
		c := newUsersHandlerCase()
		c.name = mc.name
		c.method = mc.method
		c.expectedCode = mc.expectedCode
		callUsersHandler(c, t)
	}

	// Test invalid POST request payloads
	payloadCases := []struct {
		name         string
		contentType  string
		body         interface{}
		expectedCode int
	}{
		{
			"Invalid content type",
			"text/html",
			createValidNewUser(),
			http.StatusUnsupportedMediaType,
		},
		{
			"Invalid payload - not a user.NewUser data type",
			contentTypeJson,
			"invalidPayload",
			http.StatusBadRequest,
		},
	}
	for _, pc := range payloadCases {
		c := newUsersHandlerCase()
		c.name = pc.name
		c.contentType = pc.contentType
		c.body = pc.body
		c.expectedCode = pc.expectedCode
		callUsersHandler(c, t)
	}

	// Test various user creation cases
	userCreationCases := []struct {
		name         string
		newUser      *users.NewUser
		userStore    *users.MockStore
		expectedCode int
	}{
		{
			"Valid NewUser",
			createValidNewUser(),
			users.NewMockStore(false, nil, nil),
			http.StatusCreated,
		},
		{
			"NewUser fails validation",
			createInvalidNewUser(),
			users.NewMockStore(false, nil, nil),
			http.StatusBadRequest,
		},
		{
			"Email already exists",
			createValidNewUser(),
			users.NewMockStore(false, &users.User{Email: "test@test.com"}, nil),
			http.StatusBadRequest,
		},
		{
			"UserName already exists",
			createValidNewUser(),
			users.NewMockStore(false, &users.User{Email: "test"}, nil),
			http.StatusBadRequest,
		},
		{
			"UserStore insert fails",
			createValidNewUser(),
			users.NewMockStore(true, nil, nil),
			http.StatusInternalServerError,
		},
	}
	for _, uc := range userCreationCases {
		c := newUsersHandlerCase()
		c.name = uc.name
		c.body = uc.newUser
		c.userStore = uc.userStore
		c.expectedCode = uc.expectedCode
		callUsersHandler(c, t)
	}

	// Test other cases
	otherCases := []struct {
		name         string
		signingKey   string
		expectedCode int
	}{
		{
			"Empty signing Key",
			"",
			http.StatusInternalServerError,
		},
	}
	for _, oc := range otherCases {
		c := newUsersHandlerCase()
		c.name = oc.name
		c.signingKey = oc.signingKey
		c.expectedCode = oc.expectedCode
		callUsersHandler(c, t)
	}
}

type SpecificUserHandlerCase struct {
	name                string
	method              string
	isAuthenticated     bool
	requestedUserID     string
	requestedUser       *users.User
	requestedUserExists bool
	contentType         string
	updates             *users.Updates
	expectedCode        int
}

func newSpecificUserHandlerCase() SpecificUserHandlerCase {
	return SpecificUserHandlerCase{
		name:                "",
		method:              http.MethodGet,
		isAuthenticated:     true,
		requestedUserID:     "me",
		requestedUser:       &users.User{ID: 1},
		requestedUserExists: true,
		contentType:         contentTypeJson,
		updates:             nil,
		expectedCode:        http.StatusOK,
	}
}

func callSpecificUserHandler(c SpecificUserHandlerCase, t *testing.T) {
	me := &users.User{ID: 1}
	signingKey := "testKey"
	sessionStore := sessions.NewMemStore(time.Hour, time.Minute)

	// Prepare request body
	var requestBody io.Reader
	if c.method == http.MethodPatch {
		updates, err := json.Marshal(c.updates)
		if err != nil {
			t.Fatalf("unexpected error marshaling updates to JSON")
		}
		requestBody = bytes.NewBuffer(updates)
	} else {
		requestBody = nil
	}

	// Create request
	request, err := http.NewRequest(c.method, fmt.Sprintf("/v1/users/%v", c.requestedUserID), requestBody)
	if err != nil {
		t.Fatalf("unexpected error sending requests")
	}
	request.Header.Set(headerContentType, c.contentType)

	// Add authorization to the request if the user is authenticated
	if c.isAuthenticated {
		// Set up session for the authenticated user
		sessionState := &SessionState{User: me}
		sid, err := sessions.NewSessionID(signingKey)
		if err != nil {
			t.Fatalf("unexpected error creating session ID")
		}
		err = sessionStore.Save(sid, sessionState)
		if err != nil {
			t.Fatalf("unexpected error saving to session store")
		}
		// Add authorization header
		request.Header.Set("Authorization", "Bearer "+sid.String())
	}

	// Set up requested user in mock user store
	var userStore *users.MockStore
	if c.requestedUserID == "me" {
		userStore = users.NewMockStore(false, me, nil)
	} else if c.requestedUserExists {
		userStore = users.NewMockStore(false, c.requestedUser, nil)
	} else {
		userStore = users.NewMockStore(true, nil, nil)
	}

	// Create handler and serve HTTP requests
	ctx := HandlerContext{
		SigningKey:   signingKey,
		SessionStore: sessionStore,
		UserStore:    userStore,
	}
	handler := http.HandlerFunc(ctx.SpecificUserHandler)

	responseWriter := httptest.NewRecorder()
	handler.ServeHTTP(responseWriter, request)

	// Check status code is as expected
	status := responseWriter.Code
	if status != c.expectedCode {
		t.Errorf("case %s: wrong status code - got %v but expected %v", c.name, status, c.expectedCode)
	}
	// Check user response is as expected
	if status == http.StatusOK {
		// Check if the returned user response is as expected
		responseUser := &users.User{}
		if err = json.Unmarshal(responseWriter.Body.Bytes(), responseUser); err != nil {
			t.Fatalf("case %s: unexpected error unmarshaling response user", c.name)
		}
		if !reflect.DeepEqual(userStore.User, responseUser) {
			t.Errorf("case %s: expected user is not equal to actual user", c.name)
		}
	}
}

func TestSpecificUserHandler(t *testing.T) {
	// Test different request methods
	methodCases := []struct {
		name         string
		method       string
		expectedCode int
	}{
		{
			"Illegal method PUT",
			"PUT",
			http.StatusMethodNotAllowed,
		},
		{
			"Illegal method POST",
			"POST",
			http.StatusMethodNotAllowed,
		},
		{
			"Illegal method DELETE",
			"DELETE",
			http.StatusMethodNotAllowed,
		},
	}
	for _, mc := range methodCases {
		c := newSpecificUserHandlerCase()
		c.name = mc.name
		c.method = mc.method
		c.expectedCode = mc.expectedCode
		callSpecificUserHandler(c, t)
	}

	// Test whether the user is authenticated
	authCases := []struct {
		name            string
		isAuthenticated bool
		expectedCode    int
	}{
		{
			"Authenticated user",
			true,
			http.StatusOK,
		},
		{
			"Unauthenticated user",
			false,
			http.StatusUnauthorized,
		},
	}
	for _, ac := range authCases {
		c := newSpecificUserHandlerCase()
		c.name = ac.name
		c.isAuthenticated = ac.isAuthenticated
		c.expectedCode = ac.expectedCode
		callSpecificUserHandler(c, t)
	}

	// Test requested user IDs
	requestedUserIDCases := []struct {
		name            string
		requestedUserID string
		expectedCode    int
	}{
		{
			"Requested /v1/users/me",
			"me",
			http.StatusOK,
		},
		{
			"Requested /v1/users/1",
			"1",
			http.StatusOK,
		},
		{
			"Requested /v1/users/bad",
			"bad",
			http.StatusBadRequest,
		},
	}
	for _, rc := range requestedUserIDCases {
		c := newSpecificUserHandlerCase()
		c.name = rc.name
		c.requestedUserID = rc.requestedUserID
		c.expectedCode = rc.expectedCode
		callSpecificUserHandler(c, t)
	}

	// Test get requests
	getCases := []struct {
		name                string
		requestedUserID     string
		requestedUser       *users.User
		requestedUserExists bool
		expectedCode        int
	}{
		{
			"GET request for \"me\"",
			"me",
			&users.User{ID: 1},
			true,
			http.StatusOK,
		},
		{
			"GET request for existing user",
			"123",
			&users.User{ID: 123},
			true,
			http.StatusOK,
		},
		{
			"GET request for nonexisting user",
			"123",
			&users.User{ID: 123},
			false,
			http.StatusNotFound,
		},
	}
	for _, gc := range getCases {
		c := newSpecificUserHandlerCase()
		c.name = gc.name
		c.requestedUserID = gc.requestedUserID
		c.requestedUser = gc.requestedUser
		c.requestedUserExists = gc.requestedUserExists
		c.expectedCode = gc.expectedCode
		callSpecificUserHandler(c, t)
	}

	// Test patch user authorization
	patchAuthCases := []struct {
		name            string
		requestedUserID string
		requestedUser   *users.User
		expectedCode    int
	}{
		{
			"PATCH request for me",
			"me",
			&users.User{ID: 1},
			http.StatusOK,
		},
		{
			"PATCH request for same ID as current user",
			"1",
			&users.User{ID: 1},
			http.StatusOK,
		},
		{
			"PATCH request for different user",
			"123",
			&users.User{ID: 123},
			http.StatusForbidden,
		},
	}
	for _, pac := range patchAuthCases {
		c := newSpecificUserHandlerCase()
		c.name = pac.name
		c.method = http.MethodPatch
		c.requestedUserID = pac.requestedUserID
		c.requestedUser = pac.requestedUser
		c.expectedCode = pac.expectedCode
		callSpecificUserHandler(c, t)
	}

	// Test patch payload
	patchPayloadCases := []struct {
		name         string
		contentType  string
		updates      *users.Updates
		expectedCode int
	}{
		{
			"Valid PATCH request",
			contentTypeJson,
			&users.Updates{FirstName: "Hello", LastName: "World"},
			http.StatusOK,
		},
		{
			"PATCH payload Content-Type not JSON",
			"text/html",
			&users.Updates{FirstName: "Hello", LastName: "World"},
			http.StatusUnsupportedMediaType,
		},
		{
			"PATCH payload invalid updates",
			contentTypeJson,
			&users.Updates{FirstName: "$$$", LastName: "$$$"},
			http.StatusBadRequest,
		},
	}
	for _, ppc := range patchPayloadCases {
		c := newSpecificUserHandlerCase()
		c.name = ppc.name
		c.method = http.MethodPatch
		c.contentType = ppc.contentType
		c.updates = ppc.updates
		c.expectedCode = ppc.expectedCode
		callSpecificUserHandler(c, t)
	}
}

func TestSessionsHandler(t *testing.T) {
	// Check that only POST is allowed
	methodCases := []struct {
		method       string
		expectedCode int
	}{
		{
			"GET",
			http.StatusMethodNotAllowed,
		},
		{
			"PUT",
			http.StatusMethodNotAllowed,
		},
		{
			"PATCH",
			http.StatusMethodNotAllowed,
		},
		{
			"DELETE",
			http.StatusMethodNotAllowed,
		},
	}

	for _, c := range methodCases {
		request, err := http.NewRequest(c.method, "/v1/sessions", nil)
		if err != nil {
			t.Errorf("unexpected error sending requests")
		}

		request.Header.Set(headerContentType, contentTypeJson)

		// Create mock endpoint to send requests to
		responseWriter := httptest.NewRecorder()

		// Create handler to serve HTTP requests
		ctx := HandlerContext{}
		handler := http.HandlerFunc(ctx.SessionsHandler)
		handler.ServeHTTP(responseWriter, request)
		if status := responseWriter.Code; status != c.expectedCode {
			t.Errorf("wrong status code - got %v but expected %v", status, c.expectedCode)
		}
	}

	cases := []struct {
		name             string
		method           string
		stringifiedUser  string
		testSessionKey   string
		testSessionStore *sessions.MemStore
		testUserStore    *users.MockStore // Needs to be a mock
		expectedUser     *users.User
		expectedError    bool
		expectedCode     int
		contentType      string
	}{
		{
			"Valid Credentials (Happy Case)",
			"POST",
			`{"email": "test@uw.edu", "password": "testPassword"}`,
			"testKey",
			sessions.NewMemStore(time.Hour, time.Minute),
			users.NewMockStore(false, createTestUserWithCredentials(), nil),
			createTestUser(),
			false,
			http.StatusCreated,
			contentTypeJson,
		},
		{
			"Invalid Password",
			"POST",
			`{"email": "test@uw.edu", "password": "wrongPassword"}`,
			"testKey",
			sessions.NewMemStore(time.Hour, time.Minute),
			users.NewMockStore(false, createTestUserWithCredentials(), nil),
			createTestUser(),
			true,
			http.StatusUnauthorized,
			contentTypeJson,
		},
		{
			"Invalid Email",
			"POST",
			`{"email": "wrongemail@uw.edu", "password": "testPassword"}`,
			"testKey",
			sessions.NewMemStore(time.Hour, time.Minute),
			users.NewMockStore(true, createTestUserWithCredentials(), nil),
			createTestUser(),
			true,
			http.StatusUnauthorized,
			contentTypeJson,
		},
		{
			"Malformed Credentials",
			"POST",
			"!invalid,json",
			"testKey",
			sessions.NewMemStore(time.Hour, time.Minute),
			users.NewMockStore(false, createTestUserWithCredentials(), nil),
			nil,
			true,
			http.StatusBadRequest,
			contentTypeJson,
		},
		{
			"Invalid Content-Type",
			"POST",
			"",
			"testKey",
			sessions.NewMemStore(time.Hour, time.Minute),
			users.NewMockStore(false, nil, nil),
			nil,
			true,
			http.StatusUnsupportedMediaType,
			"text/html",
		},
	}
	for _, c := range cases {
		// Create test request and query
		encodedUser := []byte(c.stringifiedUser)
		userAsQuery := bytes.NewBuffer(encodedUser)
		request, err := http.NewRequest(c.method, "v1/sessions", userAsQuery)
		if err != nil {
			t.Errorf("case %s: unexpected error sending requests", c.name)
		}

		request.Header.Set(headerContentType, c.contentType)

		// Create mock endpoint to send requests to
		responseWriter := httptest.NewRecorder()

		// Create handler to serve HTTP requests
		ctx := HandlerContext{
			SigningKey:   c.testSessionKey,
			SessionStore: c.testSessionStore,
			UserStore:    c.testUserStore,
		}
		handler := http.HandlerFunc(ctx.SessionsHandler)
		handler.ServeHTTP(responseWriter, request)

		// Check if status code is as expected
		status := responseWriter.Result().StatusCode
		if status == http.StatusOK && c.expectedError {
			t.Errorf("case %s: expected error but did not receive one", c.name)
		}
		if status != c.expectedCode {
			t.Errorf("case %s: wrong status code - got %v but expected %v", c.name, status, c.expectedCode)
		}
		if status == http.StatusCreated {
			testUser := &users.User{}
			// Check if error occurred when logging to writer
			if err = json.Unmarshal(responseWriter.Body.Bytes(), testUser); err != nil {
				t.Errorf("case %s: unexpected error unmarshaling test user", c.name)
			}

			// Check if the returned user is equal to the stored user
			equal, errMsg := checkUserEquality(c.testUserStore.User, testUser)
			if !equal {
				t.Errorf("case %s: %s", c.name, errMsg)
			}
		}

	}

}

func TestSpecificSessionHandler(t *testing.T) {
	// Check that only DELETE is allowed
	methodCases := []struct {
		method       string
		expectedCode int
	}{
		{

			"GET",
			http.StatusMethodNotAllowed,
		},
		{
			"PUT",
			http.StatusMethodNotAllowed,
		},
		{
			"PATCH",
			http.StatusMethodNotAllowed,
		},
		{
			"POST",
			http.StatusMethodNotAllowed,
		},
	}

	for _, c := range methodCases {
		request, err := http.NewRequest(c.method, "v1/sessions/mine", nil)
		if err != nil {
			t.Errorf("unexpected error sending requests")
		}

		request.Header.Set(headerContentType, contentTypeJson)

		// Create mock endpoint to send requests to
		responseWriter := httptest.NewRecorder()

		// Create handler to serve HTTP requests
		ctx := HandlerContext{}
		handler := http.HandlerFunc(ctx.SpecificSessionHandler)
		handler.ServeHTTP(responseWriter, request)
		if status := responseWriter.Code; status != c.expectedCode {
			t.Errorf("wrong status code - got %v but expected %v", status, c.expectedCode)
		}
	}

	// Check for failure if missing authorization
	authorizationCases := []struct {
		name            string
		isAuthenticated bool
		expectedCode    int
	}{
		{
			"Authorized (Happy Case)",
			true,
			http.StatusOK,
		},
		{
			"Unauthorized",
			false,
			http.StatusInternalServerError,
		},
	}

	for _, c := range authorizationCases {
		request, err := http.NewRequest("DELETE", "/v1/sessions/mine", nil)
		if err != nil {
			t.Errorf("unexpected error sending requests")
		}

		request.Header.Set(headerContentType, contentTypeJson)

		ctx := HandlerContext{
			SigningKey:   "testKey",
			SessionStore: sessions.NewMemStore(time.Hour, time.Minute),
			UserStore:    users.NewMockStore(false, nil, nil),
		}

		// Create new authentication to permit operations on sessionStore
		if c.isAuthenticated {
			testUser := createTestUser()
			sid, err := sessions.NewSessionID(ctx.SigningKey)
			if err != nil {
				t.Errorf("unexpected error setting up authentication for test case: %v", err)
			}
			err = ctx.SessionStore.Save(sid, testUser)
			if err != nil {
				t.Errorf("unexpected error setting up authentication for test case: %v", err)
			}
			request.Header.Set("Authorization", "Bearer "+sid.String())
		}

		// Create mock endpoint to send requests to
		responseWriter := httptest.NewRecorder()

		// Create handler to serve HTTP requests
		handler := http.HandlerFunc(ctx.SpecificSessionHandler)
		handler.ServeHTTP(responseWriter, request)

		if status := responseWriter.Code; status != c.expectedCode {
			t.Errorf("wrong status code - got %v but expected %v", status, c.expectedCode)
		}
	}

	// Check that only v1/sessions/mine is allowed
	pathCases := []struct {
		name         string
		sessionPath  string
		expectedCode int
	}{
		{
			"Normal Path Segment (Happy Case)",
			"mine",
			http.StatusOK,
		},
		{
			"Invalid Path Segment",
			"1",
			http.StatusForbidden,
		},
	}

	for _, c := range pathCases {
		request, err := http.NewRequest("DELETE", fmt.Sprintf("/v1/sessions/%v", c.sessionPath), nil)
		if err != nil {
			t.Errorf("unexpected error sending requests")
		}
		request.Header.Set(headerContentType, contentTypeJson)

		// Create mock endpoint to send requests to
		responseWriter := httptest.NewRecorder()

		// Create handler to serve HTTP requests
		ctx := HandlerContext{
			SigningKey:   "testKey",
			SessionStore: sessions.NewMemStore(time.Hour, time.Minute),
			UserStore:    users.NewMockStore(false, nil, nil),
		}
		// Create new authentication to permit operations on sessionStore
		testUser := createTestUser()
		sid, err := sessions.NewSessionID(ctx.SigningKey)
		if err != nil {
			t.Errorf("unexpected error setting up authentication for test case: %v", err)
		}
		err = ctx.SessionStore.Save(sid, testUser)
		if err != nil {
			t.Errorf("unexpected error setting up authentication for test case: %v", err)
		}
		request.Header.Set("Authorization", "Bearer "+sid.String())

		handler := http.HandlerFunc(ctx.SpecificSessionHandler)
		handler.ServeHTTP(responseWriter, request)

		if status := responseWriter.Code; status != c.expectedCode {
			t.Errorf("wrong status code - got %v but expected %v", status, c.expectedCode)
		}
	}
}
