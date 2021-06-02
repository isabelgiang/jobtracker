import firebase from 'firebase/app';
import React, { useState, useEffect }from 'react';
import { Route , Switch, Redirect } from 'react-router-dom';
import ApplicationPage from './Components/ApplicationPage';
import LandingPage from './Components/LandingPage';
import DashboardPage from './Components/DashboardPage';
import SignInPage from './Components/SignInPage';
import api from './Constants/APIEndpoints/APIEndpoints';

export default function App(props) {
  const [authToken, setAuthToken] = useState(localStorage.getItem("Authorization") || undefined);
  const [user, setUser] = useState(undefined);
  const [errorMessage, setErrorMessage] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);

  let applications = props.applications;

  const getCurrentUser = async () => {
    if (!authToken) {
      return;
    }
    const response = await fetch(api.base + api.handlers.myuser, {
      headers: new Headers({
        "Authorization": authToken
      })
    });
    if (response.status >= 300) {
      alert("Unable to verify login. Logging out...");
      localStorage.setItem("Authorization", "");
      setAuthToken("");
      setUser(undefined)
      return;
  }
    const user = await response.json()
    setUser(user);
  }

  //A callback function for registering new users
  /*const handleSignUp = (email, password, displayName) => {
    setErrorMessage(null); //clear any old errors
    let profileInfo = {
      displayName: displayName
    };
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredentials) => {
          let firebaseUser = userCredentials.user; //access the newly created user
          setUser(firebaseUser); //
          return firebaseUser.updateProfile(profileInfo);
      })
      .then(() => {
        let updatedUser = {
          ...user,
          ...profileInfo
        }
        setUser(updatedUser);
      })
      .catch((error) => { //report any errors
          setErrorMessage(error.message);
      });
  }*/
  const handleSignUp = async (formValues) => {
    setErrorMessage(null); //clear any old errors
    try {
      const response = await fetch(api.base + api.handlers.users, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(formValues)
      });
      console.log(`The form values are ${JSON.stringify(formValues)}`);
      if (response.status >= 300) {
        const errorMessage = await response.text();
        setErrorMessage(errorMessage);
        return;
      }
      const authToken = response.headers.get("Authorization")
      localStorage.setItem("Authorization", authToken);
      setErrorMessage("");
      setAuthToken(authToken);
      const user = await response.json();
      setUser(user);
    } catch (error) {
      setErrorMessage(error.message);
    };
  }

  //A callback function for signing in existing users
  const handleSignIn = (formValues) => {
    setErrorMessage(null); //clear any old errors
    try (
      cons
    )
  }

  // Effect hook for handling authentication events
  /*
  useEffect(() => {
    let unregisterAuthStateListener = firebase.auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(undefined);
      }
      setIsLoading(false);
    });
    return unregisterAuthStateListener;
  }, [user]);*/
  useEffect(() => {
    let unregisterAuthStateListener = getCurrentUser
    return unregisterAuthStateListener;
  }, [user]);

  //A callback function for signing out the current user
  const handleSignOut = () => {
    setErrorMessage(null); //clear any old errors
    firebase.auth().signOut()
      .catch((error) => {
        setErrorMessage(error.message);
      });
  }

  // Render functions
  function renderSignInPage(props) {
    return <SignInPage {...props} signInCallback={handleSignIn} signUpCallback={handleSignUp} />
  }
  function renderDashboardPage(props) {
    return <DashboardPage {...props} applications={applications} currentUser={user} signOutCallback={handleSignOut} />
  }
  function renderApplicationPage(props) {
    return <ApplicationPage {...props} applications={applications} />
  }

  return (
    <Switch>
      <Route exact path="/">
        { user ? <Redirect to="/dashboard" /> : LandingPage }
      </Route>
      <Route path="/sign-in">
        { user ? <Redirect to="/dashboard" /> : renderSignInPage }
      </Route>
      <Route exact path="/dashboard">
        { user ? renderDashboardPage : <Redirect to="/" /> }
      </Route>
      <Route path="/applications/:applicationID" render={renderApplicationPage} />
      <Redirect to="/" />
    </Switch>
  );
}
