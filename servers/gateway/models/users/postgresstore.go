package users

import (
	"database/sql"
	"fmt"
	"strings"

	_ "github.com/lib/pq"
)

//PostgresStore represents a user.Store backed by postgres.
type PostgresStore struct {
	DB *sql.DB
}

//NewPostgresStore returns a new PostgresStore
func NewPostgresStore(db *sql.DB) (*PostgresStore, error) {
	if db == nil {
		panic("missing database connection")
	}
	return &PostgresStore{DB: db}, nil
}

//user.Store implementation

//GetByID returns the User with the given ID
func (ps *PostgresStore) GetByID(id int64) (*User, error) {
	u := &User{}
	err := ps.DB.QueryRow("select * from users where id = $1", id).Scan(&u.ID, &u.Email, &u.PassHash, &u.UserName, &u.FirstName, &u.LastName, &u.PhotoURL)
	if err != nil {
		return nil, fmt.Errorf("error querying the user with the id %v: %v", id, err)
	}
	return u, nil
}

//GetByEmail returns the User with the given email
func (ps *PostgresStore) GetByEmail(email string) (*User, error) {
	u := &User{}
	email = strings.TrimSpace(email)
	//Using QueryRow since email has unique constraint
	err := ps.DB.QueryRow("select * from users where email = $1", email).Scan(&u.ID, &u.Email, &u.PassHash, &u.UserName, &u.FirstName, &u.LastName, &u.PhotoURL)
	if err != nil {
		return nil, fmt.Errorf("error querying the user with the email %v: %v", email, err)
	}
	return u, nil
}

//GetByUserName returns the User with the given Username
func (ps *PostgresStore) GetByUserName(username string) (*User, error) {
	u := &User{}
	//Using QueryRow since username has unique constraint
	err := ps.DB.QueryRow("select * from users where username = $1", username).Scan(&u.ID, &u.Email, &u.PassHash, &u.UserName, &u.FirstName, &u.LastName, &u.PhotoURL)
	if err != nil {
		return nil, fmt.Errorf("error querying the user with the username %v: %v", username, err)
	}
	return u, nil
}

//Insert inserts the user into the database, and returns
//the newly-inserted User, complete with the DBMS-assigned ID
func (ps *PostgresStore) Insert(user *User) (*User, error) {
	//structure a statement to insert a new row into the "users" table
	insq := "insert into users(email, passhash, username, firstname, lastname, photourl) values ($1, $2, $3, $4, $5, $6) returning id"
	//insert and get the auto-assigned ID for the new row
	var id int64
	err := ps.DB.QueryRow(insq, user.Email, user.PassHash, user.UserName, user.FirstName, user.LastName, user.PhotoURL).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("error inserting new row: %v", err)
	}
	//set the id field in the user and return
	user.ID = id
	return user, nil
}

//Update applies UserUpdates to the given user ID
//and returns the newly-updated user
func (ps *PostgresStore) Update(id int64, updates *Updates) (*User, error) {
	u := &User{}
	//set up update query to update the row with the first and last name from the update struct
	//returning the updated row
	updateq := "update users set firstname = $1, lastname = $2 where id = $3 returning *"
	err := ps.DB.QueryRow(updateq, updates.FirstName, updates.LastName, id).Scan(&u.ID, &u.Email, &u.PassHash, &u.UserName, &u.FirstName, &u.LastName, &u.PhotoURL)
	if err != nil {
		return nil, fmt.Errorf("error updating the user with id %v: %v", id, err)
	}
	return u, nil
}

//Delete deletes the user with the given ID
func (ps *PostgresStore) Delete(id int64) error {
	_, err := ps.DB.Exec("delete from users where id = $1", id)
	if err != nil {
		return fmt.Errorf("error deleting the user with the id %v: %v", id, err)
	}
	return nil
}

//LogSignIn logs a new sign-in attempt by a user
func (ps *PostgresStore) LogSignIn(signin *UserSignIn) (*UserSignIn, error) {
	logq := "insert into usersignins(userid, signintime, ip) values ($1, $2, $3) returning *"
	si := &UserSignIn{}
	err := ps.DB.QueryRow(logq, signin.UserID, signin.SignInTime, signin.IP).Scan(
		&si.ID, &si.IP, &si.SignInTime, &si.SignInTime,
	)
	if err != nil {
		return nil, fmt.Errorf("error logging a sign-in attempt for the user with the id %v: %v", signin.UserID, err)
	}
	return si, nil
}
