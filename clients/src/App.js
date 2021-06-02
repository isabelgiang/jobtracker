import React, { Component } from 'react';
import { Route , Switch, Redirect } from 'react-router-dom';
import Auth from './Components/Auth/Auth';
import PageTypes from './Constants/PageTypes/PageTypes';
import Main from './Components/Main/Main';
import LandingPage from './Components/LandingPage';
import DashboardPage from './Components/DashboardPage';
import ApplicationPage from './Components/ApplicationPage';
import './Styles/App.css';
import api from './Constants/APIEndpoints/APIEndpoints';

class App extends Component {
    constructor() {
        super();
        this.state = {
            page: localStorage.getItem("Authorization") ? PageTypes.signedInMain : PageTypes.signIn,
            authToken: localStorage.getItem("Authorization") || null,
            user: null
        }

        this.getCurrentUser()
    }

    /**
     * @description Gets the users
     */
    getCurrentUser = async () => {
        if (!this.state.authToken) {
            return;
        }
        const response = await fetch(api.base + api.handlers.myuser, {
            headers: new Headers({
                "Authorization": this.state.authToken
            })
        });
        if (response.status >= 300) {
            alert("Unable to verify login. Logging out...");
            localStorage.setItem("Authorization", "");
            this.setAuthToken("");
            this.setUser(null)
            return;
        }
        const user = await response.json()
        this.setUser(user);

    }

    /**
     * @description sets the page type to sign in
     */
    setPageToSignIn = (e) => {
        e.preventDefault();
        this.setState({ page: PageTypes.signIn });
    }

    /**
     * @description sets the page type to sign up
     */
    setPageToSignUp = (e) => {
        e.preventDefault();
        this.setState({ page: PageTypes.signUp });
    }

    setPage = (e, page) => {
        e.preventDefault();
        this.setState({ page });
    }

    /**
     * @description sets auth token
     */
    setAuthToken = (authToken) => {
        this.setState({ authToken, page: authToken === "" ? PageTypes.signIn : PageTypes.signedInMain });
    }

    /**
     * @description sets the user
     */
    setUser = (user) => {
        this.setState({ user });
    }

    handleSignOut = () => {
        console.log('Signing out... not!');
      }


    renderLandingPage = () => {
        return <LandingPage />
    }

    renderAuthPage = () => {
        return <Auth
            page={this.state.page}
            setPage={this.setPage}
            setAuthToken={this.setAuthToken}
            setUser={this.setUser}
        />
    }

    renderDashboardPage = () => {
        return <DashboardPage
            {...this.props}
            currentUser={this.state.user}
            signOutCallback={this.handleSignOut}
        />
    }

    renderApplicationPage = () => {
        return <ApplicationPage {...this.props} />
    }

    render() {
        const user = this.state.user;
        return (
            <Switch>
            <Route exact path="/">
                { user ? <Redirect to="/dashboard" /> : this.renderLandingPage }
            </Route>
            <Route path="/signin">
                {user ? this.renderDashboardPage : this.renderAuthPage}
            </Route>
            <Route exact path="/dashboard">
                { user ? this.renderDashboardPage : <Redirect to="/" /> }
            </Route>
            <Route path="/applications/:applicationID" render={this.renderApplicationPage} />
            <Redirect to="/" />
          </Switch>
        );
    }
}

export default App;
