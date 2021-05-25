package users

import (
	"crypto/md5"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

//gravatarBasePhotoURL is the base URL for Gravatar image requests.
//See https://id.gravatar.com/site/implement/images/ for details
const gravatarBasePhotoURL = "https://www.gravatar.com/avatar/"

//bcryptCost is the default bcrypt cost to use when hashing passwords
var bcryptCost = 13

//User represents a user account in the database
type User struct {
	ID        int64  `json:"id"`
	Email     string `json:"-"` //never JSON encoded/decoded
	PassHash  []byte `json:"-"` //never JSON encoded/decoded
	UserName  string `json:"userName"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	PhotoURL  string `json:"photoURL"`
}

//Credentials represents user sign-in credentials
type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

//NewUser represents a new user signing up for an account
type NewUser struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	PasswordConf string `json:"passwordConf"`
	UserName     string `json:"userName"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
}

//Updates represents allowed updates to a user profile
type Updates struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

//UserSignIn represents a succcessful sign-in by a user
type UserSignIn struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"userID"`
	SignInTime time.Time `json:"signInTime"`
	IP         string    `json:"ip"`
}

//Validate validates the new user and returns an error if
//any of the validation rules fail, or nil if its valid
func (nu *NewUser) Validate() error {
	_, err := mail.ParseAddress(nu.Email)
	if err != nil {
		return fmt.Errorf("invalid email address")
	}
	if len(nu.Password) < 6 {
		return fmt.Errorf("password must be at least 6 characters")
	}
	if nu.Password != nu.PasswordConf {
		return fmt.Errorf("passwords are mismatched")
	}
	if len(nu.UserName) == 0 {
		return fmt.Errorf("username cannot be empty")
	}
	if strings.Contains(nu.UserName, " ") {
		return fmt.Errorf("username cannot contain spaces")
	}
	for _, r := range nu.FirstName {
		if !unicode.IsLetter(r) {
			return fmt.Errorf("illegal character in First Name")
		}
	}
	for _, r := range nu.LastName {
		if !unicode.IsLetter(r) {
			return fmt.Errorf("illegal character in Last Name")
		}
	}
	return nil
}

//ToUser converts the NewUser to a User, setting the
//PhotoURL and PassHash fields appropriately
func (nu *NewUser) ToUser() (*User, error) {
	err := nu.Validate()
	if err != nil {
		return nil, err
	}
	u := &User{
		// Update the Email field with the parsed, clean email address
		Email:     strings.TrimSpace(nu.Email),
		UserName:  nu.UserName,
		FirstName: nu.FirstName,
		LastName:  nu.LastName,
	}
	u.SetPassword(nu.Password)
	u.SetPhotoURL(nu.Email)
	return u, nil
}

//FullName returns the user's full name, in the form:
// "<FirstName> <LastName>"
//If either first or last name is an empty string, no
//space is put between the names. If both are missing,
//this returns an empty string
func (u *User) FullName() string {
	if len(u.FirstName) == 0 && len(u.LastName) == 0 {
		return ""
	} else if len(u.FirstName) == 0 {
		return u.LastName
	} else if len(u.LastName) == 0 {
		return u.FirstName
	} else {
		return fmt.Sprintf("%s %s", u.FirstName, u.LastName)
	}
}

//SetPhotoURL sets the user's photo URL to a gravatar image URL
func (u *User) SetPhotoURL(email string) error {
	//TODO: handle invalid email address
	email = strings.ToLower(strings.TrimSpace(email))
	emailHash := md5.Sum([]byte(email))
	u.PhotoURL = gravatarBasePhotoURL + fmt.Sprintf("%x", emailHash)
	return nil
}

//SetPassword hashes the password and stores it in the PassHash field
func (u *User) SetPassword(password string) error {
	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return err
	}
	u.PassHash = passHash
	return nil
}

//Authenticate compares the plaintext password against the stored hash
//and returns an error if they don't match, or nil if they do
func (u *User) Authenticate(password string) error {
	return bcrypt.CompareHashAndPassword(u.PassHash, []byte(password))
}

//ApplyUpdates applies the updates to the user. An error
//is returned if the updates are invalid
func (u *User) ApplyUpdates(updates *Updates) error {
	for _, r := range updates.FirstName {
		if !unicode.IsLetter(r) {
			return errors.New("illegal character in First Name")
		}
	}
	for _, r := range updates.LastName {
		if !unicode.IsLetter(r) {
			return errors.New("illegal character in Last Name")
		}
	}
	u.FirstName = updates.FirstName
	u.LastName = updates.LastName
	return nil
}
