package users

import (
	"reflect"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestGetByID(t *testing.T) {
	cases := []struct {
		name         string
		expectedUser *User
		idToGet      int64
		expectError  bool
	}{
		{
			"User Found",
			&User{
				1,
				"test@test.com",
				[]byte("passhash123"),
				"username",
				"firstname",
				"lastname",
				"photourl",
			},
			1,
			false,
		},
		{
			"User Not Found",
			&User{},
			2,
			true,
		},
		{
			"User With Large ID Found",
			&User{
				1234567890,
				"test@test.com",
				[]byte("passhash123"),
				"username",
				"firstname",
				"lastname",
				"photourl",
			},
			1234567890,
			false,
		},
	}

	for _, c := range cases {
		// Create a new mock database for each case
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("There was a problem opening a database connection: [%v]", err)
		}
		defer db.Close()

		postgresStore := &PostgresStore{db}

		// Create an expected row to the mock DB
		row := mock.NewRows([]string{
			"id",
			"email",
			"passhash",
			"username",
			"firstname",
			"lastname",
			"photourl"},
		).AddRow(
			c.expectedUser.ID,
			c.expectedUser.Email,
			c.expectedUser.PassHash,
			c.expectedUser.UserName,
			c.expectedUser.FirstName,
			c.expectedUser.LastName,
			c.expectedUser.PhotoURL,
		)

		query := regexp.QuoteMeta("select * from users where id = $1")

		if c.expectError {
			// Set up expected query that will expect an error
			mock.ExpectQuery(query).WithArgs(c.idToGet).WillReturnError(ErrUserNotFound)

			user, err := postgresStore.GetByID(c.idToGet)
			if user != nil || err == nil {
				t.Errorf("Expected error [%v] but got [%v] instead", ErrUserNotFound, err)
			}
		} else {
			// Set up an expected query with the expected row from the mock DB
			mock.ExpectQuery(query).WithArgs(c.idToGet).WillReturnRows(row)

			user, err := postgresStore.GetByID(c.idToGet)
			if err != nil {
				t.Errorf("Unexpected error on successful test [%s]: %v", c.name, err)
			}
			if !reflect.DeepEqual(user, c.expectedUser) {
				t.Errorf("Error, invalid match in test [%s]", c.name)
			}
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("There were unfulfilled expectations: %s", err)
		}

	}
}

func TestGetByEmail(t *testing.T) {
	cases := []struct {
		name         string
		expectedUser *User
		emailToGet   string
		expectError  bool
	}{
		{
			"User Found",
			&User{
				1,
				"test@test.com",
				[]byte("passhash123"),
				"username",
				"firstname",
				"lastname",
				"photourl",
			},
			"test@test.com",
			false,
		},
		{
			"User Not Found",
			&User{},
			"nothere@test.com",
			true,
		},
	}

	for _, c := range cases {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("There was a problem opening a database connection: [%v]", err)
		}
		defer db.Close()

		postgresStore := &PostgresStore{db}

		// Create an expected row to the mock DB
		row := mock.NewRows([]string{
			"id",
			"email",
			"passhash",
			"username",
			"firstname",
			"lastname",
			"photourl"},
		).AddRow(
			c.expectedUser.ID,
			c.expectedUser.Email,
			c.expectedUser.PassHash,
			c.expectedUser.UserName,
			c.expectedUser.FirstName,
			c.expectedUser.LastName,
			c.expectedUser.PhotoURL,
		)

		query := regexp.QuoteMeta("select * from users where email = $1")

		if c.expectError {
			// Set up expected query that will expect an error
			mock.ExpectQuery(query).WithArgs(c.emailToGet).WillReturnError(ErrUserNotFound)

			user, err := postgresStore.GetByEmail(c.emailToGet)
			if user != nil || err == nil {
				t.Errorf("Expected error [%v] but got [%v] instead", ErrUserNotFound, err)
			}
		} else {
			// Set up an expected query with the expected row from the mock DB
			mock.ExpectQuery(query).WithArgs(c.emailToGet).WillReturnRows(row)

			user, err := postgresStore.GetByEmail(c.emailToGet)
			if err != nil {
				t.Errorf("Unexpected error on successful test [%s]: %v", c.name, err)
			}
			if !reflect.DeepEqual(user, c.expectedUser) {
				t.Errorf("Error, invalid match in test [%s]", c.name)
			}
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("There were unfulfilled expectations: %s", err)
		}
	}
}

func TestGetByUserName(t *testing.T) {
	cases := []struct {
		name          string
		expectedUser  *User
		userNameToGet string
		expectError   bool
	}{
		{
			"User Found",
			&User{
				1,
				"test@test.com",
				[]byte("passhash123"),
				"username",
				"firstname",
				"lastname",
				"photourl",
			},
			"username",
			false,
		},
		{
			"User Not Found",
			&User{},
			"notthere",
			true,
		},
	}

	for _, c := range cases {
		// Create a new mock database for each case
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("There was a problem opening a database connection: [%v]", err)
		}
		defer db.Close()

		postgresStore := &PostgresStore{db}

		// Create an expected row to the mock DB
		row := mock.NewRows([]string{
			"id",
			"email",
			"passhash",
			"username",
			"firstname",
			"lastname",
			"photourl"},
		).AddRow(
			c.expectedUser.ID,
			c.expectedUser.Email,
			c.expectedUser.PassHash,
			c.expectedUser.UserName,
			c.expectedUser.FirstName,
			c.expectedUser.LastName,
			c.expectedUser.PhotoURL,
		)

		query := regexp.QuoteMeta("select * from users where username = $1")

		if c.expectError {
			// Set up expected query that will expect an error
			mock.ExpectQuery(query).WithArgs(c.userNameToGet).WillReturnError(ErrUserNotFound)

			user, err := postgresStore.GetByUserName(c.userNameToGet)
			if user != nil || err == nil {
				t.Errorf("Expected error [%v] but got [%v] instead", ErrUserNotFound, err)
			}
		} else {
			// Set up an expected query with the expected row from the mock DB
			mock.ExpectQuery(query).WithArgs(c.userNameToGet).WillReturnRows(row)

			user, err := postgresStore.GetByUserName(c.userNameToGet)
			if err != nil {
				t.Errorf("Unexpected error on successful test [%s]: %v", c.name, err)
			}
			if !reflect.DeepEqual(user, c.expectedUser) {
				t.Errorf("Error, invalid match in test [%s]", c.name)
			}
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("There were unfulfilled expectations: %s", err)
		}
	}
}

func TestInsert(t *testing.T) {
	cases := []struct {
		name         string
		userToInsert *User
		expectError  bool
	}{
		{
			name: "Valid user",
			userToInsert: &User{
				ID:        1,
				Email:     "test@test.com",
				PassHash:  []byte("passhash"),
				UserName:  "username",
				FirstName: "firstname",
				LastName:  "lastname",
				PhotoURL:  "photourl",
			},
			expectError: false,
		},
	}

	for _, c := range cases {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("There was a problem opening a database connection: [%v]", err)
		}
		defer db.Close()
		postgresStore := &PostgresStore{db}

		query := regexp.QuoteMeta("insert into users(email, passhash, username, firstname, lastname, photourl) values ($1, $2, $3, $4, $5, $6) returning id")
		expectedRow := sqlmock.NewRows([]string{"id"}).AddRow(c.userToInsert.ID)
		mock.ExpectQuery(query).WithArgs(
			c.userToInsert.Email, c.userToInsert.PassHash, c.userToInsert.UserName,
			c.userToInsert.FirstName, c.userToInsert.LastName, c.userToInsert.PhotoURL,
		).WillReturnRows(expectedRow)

		//Test Insert implementation
		postgresStore.Insert(c.userToInsert)

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("There were unfulfilled expectations: %s", err)
		}
	}
}

func TestUpdate(t *testing.T) {
	cases := []struct {
		name         string
		expectedUser *User
		idToUpdate   int64
		updates      *Updates
		expectError  bool
	}{
		{
			"User Found",
			&User{
				1,
				"test@test.com",
				[]byte("passhash123"),
				"username",
				"firstname",
				"lastname",
				"photourl",
			},
			1,
			&Updates{
				FirstName: "updatedFirstName",
				LastName:  "updatedLastName",
			},
			false,
		},
		{
			"User Not Found",
			&User{},
			2,
			&Updates{
				FirstName: "updatedFirstName",
				LastName:  "updatedLastName",
			},
			true,
		},
	}

	for _, c := range cases {
		// Create a new mock database for each case
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("There was a problem opening a database connection: [%v]", err)
		}
		defer db.Close()

		postgresStore := &PostgresStore{db}

		// Create an expected row to the mock DB
		row := mock.NewRows([]string{
			"id",
			"email",
			"passhash",
			"username",
			"firstname",
			"lastname",
			"photourl"},
		).AddRow(
			c.expectedUser.ID,
			c.expectedUser.Email,
			c.expectedUser.PassHash,
			c.expectedUser.UserName,
			c.expectedUser.FirstName,
			c.expectedUser.LastName,
			c.expectedUser.PhotoURL,
		)

		query := regexp.QuoteMeta("update users set firstname = $1, lastname = $2 where id = $3 returning *")

		if c.expectError {
			// Set up expected query that will expect an error
			mock.ExpectQuery(query).WithArgs(c.updates.FirstName, c.updates.LastName, c.idToUpdate).WillReturnError(ErrUserNotFound)

			user, err := postgresStore.Update(c.idToUpdate, c.updates)
			if user != nil || err == nil {
				t.Errorf("Expected error [%v] but got [%v] instead", ErrUserNotFound, err)
			}
		} else {
			// Set up an expected query with the expected row from the mock DB
			mock.ExpectQuery(query).WithArgs(c.updates.FirstName, c.updates.LastName, c.idToUpdate).WillReturnRows(row)

			user, err := postgresStore.Update(c.idToUpdate, c.updates)
			if err != nil {
				t.Errorf("Unexpected error on successful test [%s]: %v", c.name, err)
			}
			if !reflect.DeepEqual(user, c.expectedUser) {
				t.Errorf("Error, invalid match in test [%s]: the returned user is %v", c.name, user)
			}
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("There were unfulfilled expectations: %s", err)
		}
	}
}

func TestDelete(t *testing.T) {
	cases := []struct {
		name         string
		expectedUser *User
		idToDelete   int64
		expectError  bool
	}{
		{
			"User Found",
			&User{
				1,
				"test@test.com",
				[]byte("passhash123"),
				"username",
				"firstname",
				"lastname",
				"photourl",
			},
			1,
			false,
		},
		{
			"User Not Found",
			&User{},
			2,
			true,
		},
	}

	for _, c := range cases {
		// Create a new mock database for each case
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("There was a problem opening a database connection: [%v]", err)
		}
		defer db.Close()

		postgresStore := &PostgresStore{db}

		// Create an expected row to the mock DB
		mock.NewRows([]string{
			"id",
			"email",
			"passhash",
			"username",
			"firstname",
			"lastname",
			"photourl"},
		).AddRow(
			c.expectedUser.ID,
			c.expectedUser.Email,
			c.expectedUser.PassHash,
			c.expectedUser.UserName,
			c.expectedUser.FirstName,
			c.expectedUser.LastName,
			c.expectedUser.PhotoURL,
		)

		query := regexp.QuoteMeta("delete from users where id = $1")

		if c.expectError {
			// Set up expected query that will expect an error
			mock.ExpectExec(query).WithArgs(c.idToDelete).WillReturnResult(sqlmock.NewResult(0, 0))
			postgresStore.Delete(c.idToDelete)
			/*if err == nil {
				t.Errorf("Expected error [%v] but got [%v] instead", ErrUserNotFound, err)
			}*/
		} else {
			// Set up an expected query with the expected row from the mock DB
			mock.ExpectExec(query).WithArgs(c.idToDelete).WillReturnResult(sqlmock.NewResult(1, 1))
			postgresStore.Delete(c.idToDelete)
			/*if err != nil {
				t.Errorf("Unexpected error on successful test [%s]: %v", c.name, err)
			}*/
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("There were unfulfilled expectations: %s", err)
		}

	}
}
