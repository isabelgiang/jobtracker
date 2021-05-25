package users

//TODO: add tests for the various functions in user.go, as described in the assignment.
//use `go test -cover` to ensure that you are covering all or nearly all of your code paths.

import (
	"crypto/md5"
	"fmt"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestValidate(t *testing.T) {
	cases := []struct {
		name         string
		hint         string
		email        string
		password     string
		passwordConf string
		userName     string
		firstName    string
		lastName     string
		expectError  bool
	}{
		{
			name:         "Valid",
			hint:         "",
			email:        "neo@matrix.net",
			password:     "trinity123",
			passwordConf: "trinity123",
			userName:     "neo",
			firstName:    "Thomas",
			lastName:     "Anderson",
			expectError:  false,
		},
		{
			name:         "Invalid email address",
			hint:         "Check email address using mail.ParseAddress",
			email:        "neo @matrix.net",
			password:     "trinity123",
			passwordConf: "trinity123",
			userName:     "neo",
			firstName:    "Thomas",
			lastName:     "Anderson",
			expectError:  true,
		},
		{
			name:         "Password less than 6 characters",
			hint:         "Check that the password length is at least 6 characters",
			email:        "neo@matrix.net",
			password:     "trin",
			passwordConf: "trin",
			userName:     "neo",
			firstName:    "Thomas",
			lastName:     "Anderson",
			expectError:  true,
		},
		{
			name:         "Passwords mismatched",
			hint:         "Check that Password and PasswordConf match",
			email:        "neo@matrix.net",
			password:     "trinity123",
			passwordConf: "morpheus",
			userName:     "neo",
			firstName:    "Thomas",
			lastName:     "Anderson",
			expectError:  true,
		},
		{
			name:         "Empty username",
			hint:         "Check that the username is not empty",
			email:        "neo@matrix.net",
			password:     "trinity123",
			passwordConf: "trinity123",
			userName:     "",
			firstName:    "Thomas",
			lastName:     "Anderson",
			expectError:  true,
		},
		{
			name:         "Username contains space",
			hint:         "Check that the username does not contain any spaces",
			email:        "neo@matrix.net",
			password:     "trinity123",
			passwordConf: "trinity123",
			userName:     "i am neo",
			firstName:    "Thomas",
			lastName:     "Anderson",
			expectError:  true,
		},
		{
			name:         "Illegal first name",
			hint:         "Check that the first and last name only contains a-z or A-Z",
			email:        "neo@matrix.net",
			password:     "trinity123",
			passwordConf: "trinity123",
			userName:     "neo",
			firstName:    "Th0mas",
			lastName:     "Anderson",
			expectError:  true,
		},
		{
			name:         "Illegal last name",
			hint:         "Check that the first and last name only contains a-z or A-Z",
			email:        "neo@matrix.net",
			password:     "trinity123",
			passwordConf: "trinity123",
			userName:     "neo",
			firstName:    "Thomas",
			lastName:     "And3rson",
			expectError:  true,
		},
	}
	for _, c := range cases {
		nu := &NewUser{
			Email:        c.email,
			Password:     c.password,
			PasswordConf: c.passwordConf,
			UserName:     c.userName,
			FirstName:    c.firstName,
			LastName:     c.lastName,
		}
		err := nu.Validate()
		if c.expectError && err == nil {
			t.Errorf("Case: %s, Expecting an error but got nil, HINT: %s", c.name, c.hint)
		}
		if !c.expectError && err != nil {
			t.Errorf("Case: %s, Unexpected error: \"%v\", HINT: %s", c.name, err, c.hint)
		}
	}
}

func TestToUser(t *testing.T) {
	cases := []struct {
		name        string
		hint        string
		email       string
		expectError bool
	}{
		{
			name:        "Fails user validation",
			hint:        "Validate the user before creating the User record. If validation fails, return nil.",
			email:       "neo$matrix.net",
			expectError: true,
		},
		{
			name:        "Email has uppercase letters",
			hint:        "Make sure to force all characters in the email to lowercase",
			email:       "NEO@matrix.net",
			expectError: false,
		},
		{
			name:        "Email has leading/trailing whitespace",
			hint:        "Make sure to trim leading and trailing whitespace from email address",
			email:       " neo@matrix.net ",
			expectError: false,
		},
	}
	for _, c := range cases {
		nu := &NewUser{
			Email:        c.email,
			Password:     "trinity123",
			PasswordConf: "trinity123",
			UserName:     "neo",
			FirstName:    "Thomas",
			LastName:     "Anderson",
		}
		u, err := nu.ToUser()
		// Error validation
		if c.expectError && err == nil {
			t.Errorf("Case: %s, Expecting an error but got nil, HINT: %s", c.name, c.hint)
		}
		if !c.expectError && err != nil {
			t.Errorf("Case: %s, Unexpected error: \"%v\", HINT: %s", c.name, err, c.hint)
		}
		// Nil User validation
		if c.expectError && u != nil {
			t.Errorf("Case: %s, Expecting a nil User but got a non-nil one, HINT: %s", c.name, c.hint)
		}
		if !c.expectError && u == nil {
			t.Errorf("Case: %s, Expecting a non-nil User but got a nil one, HINT: %s", c.name, c.hint)
		}
		// User content validation
		if !c.expectError {
			if u.ID != 0 {
				t.Errorf("Case: %s, Make sure to leave the ID as the zero-value", c.name)
			}
			// TODO: validate other fields are set correctly
			// Check if photoURL is set correctly
			email := strings.ToLower(strings.TrimSpace(c.email))
			emailHash := md5.Sum([]byte(email))
			expectedPhotoURL := gravatarBasePhotoURL + fmt.Sprintf("%x", emailHash)
			if u.PhotoURL != expectedPhotoURL {
				t.Errorf("Case: %s, Expected PhotoURL to be %s but got %s, HINT: %s", c.name, expectedPhotoURL, u.PhotoURL, c.hint)
			}
			// TODO: check PassHash is set correctly
			err := bcrypt.CompareHashAndPassword(u.PassHash, []byte(nu.Password))
			if err != nil {
				t.Errorf("Case: %s, The PassHash was not set correctly and failed validation", c.name)
			}
		}
	}
}

func TestFullName(t *testing.T) {
	cases := []struct {
		name             string
		hint             string
		firstName        string
		lastName         string
		expectedFullName string
	}{
		{
			name:             "Both empty",
			hint:             "If both first and last name are empty, return an empty string",
			firstName:        "",
			lastName:         "",
			expectedFullName: "",
		},
		{
			name:             "First name empty",
			hint:             "If either first or last name are empty, print without space",
			firstName:        "",
			lastName:         "Wick",
			expectedFullName: "Wick",
		},
		{
			name:             "Last name empty",
			hint:             "If either first or last name are empty, print without space",
			firstName:        "John",
			lastName:         "",
			expectedFullName: "John",
		},
		{
			name:             "Non empty",
			hint:             "Print first and last name with a space in-between",
			firstName:        "John",
			lastName:         "Wick",
			expectedFullName: "John Wick",
		},
	}
	for _, c := range cases {
		u := &User{
			FirstName: c.firstName,
			LastName:  c.lastName,
		}
		receivedFullName := u.FullName()
		if receivedFullName != c.expectedFullName {
			t.Errorf("Case: %s, HINT: %s", c.name, c.hint)
		}
	}
}

//TODO: Add unit test for SetPhotoURL
//TODO: Add unit test for SetPassword

func TestAuthenticate(t *testing.T) {
	cases := []struct {
		name        string
		hint        string
		password    string
		expectError bool
	}{
		{
			name:        "Incorrect password",
			hint:        "Use bcrypt to verify that the password matches the hash",
			password:    "wrongpassword",
			expectError: true,
		},
		{
			name:        "Correct password",
			hint:        "Return a nil error if the password matches the hash",
			password:    "bingo!",
			expectError: false,
		},
		{
			name:        "Empty string password",
			hint:        "Return an error if the password is an empty string",
			password:    "",
			expectError: true,
		},
	}
	for _, c := range cases {
		correctPassword := "bingo!"
		passHash, _ := bcrypt.GenerateFromPassword([]byte(correctPassword), bcryptCost)
		u := &User{
			PassHash: passHash,
		}
		err := u.Authenticate(c.password)
		if c.expectError && err == nil {
			t.Errorf("Case: %s, Expecting an error but got nil, HINT: %s", c.name, c.hint)
		}
		if !c.expectError && err != nil {
			t.Errorf("Case: %s, Unexpected error: \"%v\", HINT: %s", c.name, err, c.hint)
		}

	}
}

func TestApplyUpdates(t *testing.T) {
	cases := []struct {
		name        string
		hint        string
		firstName   string
		lastName    string
		expectError bool
	}{
		{
			name:        "Both valid",
			hint:        "Make sure to set the user fields to the updated fields and return nil",
			firstName:   "John",
			lastName:    "Wick",
			expectError: false,
		},
		{
			name:        "First name invalid",
			hint:        "Return an error if either first or last name contain a character other than a-z or A-Z",
			firstName:   "47",
			lastName:    "Ronin",
			expectError: true,
		},
		{
			name:        "Last name invalid",
			hint:        "Return an error if either first or last name contain a character other than a-z or A-Z",
			firstName:   "The",
			lastName:    "1",
			expectError: true,
		},
		{
			name:        "Both invalid",
			hint:        "Return an error if either first or last name contain a character other than a-z or A-Z",
			firstName:   "L33t",
			lastName:    "Haxx0r",
			expectError: true,
		},
	}
	for _, c := range cases {
		u := &User{
			FirstName: "Keanu",
			LastName:  "Reeves",
		}
		updates := &Updates{
			FirstName: c.firstName,
			LastName:  c.lastName,
		}
		err := u.ApplyUpdates(updates)
		if c.expectError && err == nil {
			t.Errorf("Case: %s, Expecting an error but got nil, HINT: %s", c.name, c.hint)
		}
		if !c.expectError && err != nil {
			t.Errorf("Case: %s, Unexpected error: \"%v\", HINT: %s", c.name, err, c.hint)
		}
		if !c.expectError && (u.FirstName != updates.FirstName || u.LastName != updates.LastName) {
			t.Errorf("Case: %s, HINT: %s", c.name, c.hint)
		}
	}
}
