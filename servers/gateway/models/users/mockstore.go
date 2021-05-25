package users

import "errors"

type MockStore struct {
	expectedError bool
	User          *User
	UserSignIn    *UserSignIn
}

func NewMockStore(err bool, user *User, signin *UserSignIn) *MockStore {
	return &MockStore{
		err,
		user,
		signin,
	}
}

func (m *MockStore) GetByID(id int64) (*User, error) {
	if m.expectedError {
		return nil, errors.New("got error")
	}
	return m.User, nil
}

func (m *MockStore) GetByEmail(email string) (*User, error) {
	if m.expectedError {
		return nil, errors.New("got error")
	}
	return m.User, nil
}

func (m *MockStore) GetByUserName(username string) (*User, error) {
	if m.expectedError {
		return nil, errors.New("got error")
	}
	return m.User, nil
}

func (m *MockStore) Insert(user *User) (*User, error) {
	if m.expectedError {
		return nil, errors.New("got error")
	}
	return m.User, nil
}

func (m *MockStore) Update(id int64, updates *Updates) (*User, error) {
	if m.expectedError {
		return nil, errors.New("got error")
	}
	err := m.User.ApplyUpdates(updates)
	if err != nil {
		return nil, errors.New("got error")
	}
	return m.User, nil
}

func (m *MockStore) Delete(id int64) error {
	if m.expectedError {
		return errors.New("got error")
	}
	return nil
}

func (m *MockStore) LogSignIn(signin *UserSignIn) (*UserSignIn, error) {
	if m.expectedError {
		return nil, errors.New("got error")
	}
	return m.UserSignIn, nil
}
