import firebase from 'firebase/app';
import React, { useState, useEffect }from 'react';
import { Route , Switch, Redirect } from 'react-router-dom';
import AboutTrailPage from './components/AboutTrailPage';
import LandingPage from './components/LandingPage';
import TrailsPage from './components/TrailsPage';
import SignInPage from './components/SignInPage';

export default function App(props) {
  const [errorMessage, setErrorMessage] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);

  let trails = props.info;

  //A callback function for registering new users
  const handleSignUp = (email, password, displayName) => {
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
  }

  //A callback function for signing in existing users
  const handleSignIn = (email, password) => {
    setErrorMessage(null); //clear any old errors
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch((error) => {
        setErrorMessage(error.message);
      });
  }

  // Effect hook for handling authentication events
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
  function renderTrailsPage(props) {
    return <TrailsPage {...props} trails={trails} currentUser={user} signOutCallback={handleSignOut} />
  }
  function renderAboutTrailPage(props) {
    return <AboutTrailPage {...props} trails={trails} />
  }

  return (
    <Switch>
      <Route exact path="/">
        { user ? <Redirect to="/trails" /> : LandingPage }
      </Route>
      <Route path="/sign-in">
        { user ? <Redirect to="/trails" /> : renderSignInPage }
      </Route>
      <Route exact path="/trails">
        { user ? renderTrailsPage : <Redirect to="/" /> }
      </Route>
      <Route path="/trails/:trailname" render={renderAboutTrailPage} />
      <Redirect to="/" />
    </Switch>
  );
}