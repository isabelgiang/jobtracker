import React, { Component } from 'react';
import { Route , Switch, Redirect } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import Auth from './Components/Auth/Auth';
import PageTypes from './Constants/PageTypes/PageTypes';
import LandingPage from './Components/Main/LandingPage';
import DashboardPage from './Components/Main/DashboardPage';
import ApplicationPage from './Components/Main/ApplicationPage';
import StageFormPage from './Components/Main/StageFormPage';
import './Styles/App.css';
import api from './Constants/APIEndpoints/APIEndpoints';

library.add(fas);

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

    handleSignOut = async (e) => {
        e.preventDefault();
        const response = await fetch(api.base + api.handlers.sessionsMine, {
            method: "DELETE",
            headers: new Headers({
                "Authorization": localStorage.getItem("Authorization"),
                "Content-Type": "application/json"
            })
        });
        if (response.status >= 300) {
            const error = await response.text();
            //setError(error);
            return;
        }
        localStorage.removeItem("Authorization");
        //setError("");
        this.setAuthToken("");
        this.setUser(null);
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
            user={this.state.user}
            signOutCallback={this.handleSignOut}
        />
    }

    renderApplicationPage = () => {
        return <ApplicationPage
            {...this.props}
            user={this.state.user}
            signOutCallback={this.handleSignOut}
        />
    }

    renderApplicationFormPage = () => {
        return <StageFormPage
            {...this.props}
            user={this.state.user}
            signOutCallback={this.handleSignOut}
        />
    }

    renderStageFormPage = () => {
        return <StageFormPage
            {...this.props}
            user={this.state.user}
            signOutCallback={this.handleSignOut}
        />
    }

    render() {
        const user = this.state.user;
        return (
            <Switch>
                <Route exact path="/">
                    { user ? <Redirect to="/dashboard" /> : this.renderLandingPage }
                </Route>
                <Route exact path="/signin">
                    { user ? <Redirect to="/dashboard" /> : this.renderAuthPage}
                </Route>
                <Route exact path="/dashboard">
                    { user ? this.renderDashboardPage : <Redirect to="/" /> }
                </Route>
                <Route exact path="/applications/:applicationID">
                    { user ? this.renderApplicationPage : <Redirect to="/" /> }
                </Route>
                <Route path="/applications/:applicationID/edit">
                    { user ? this.renderApplicationFormPage : <Redirect to="/" /> }
                </Route>
                <Route path={["/applications/:applicationID/addstage", "/stages/:stageID/edit"]}>
                    { user ? this.renderStageFormPage : <Redirect to="/" /> }
                </Route>
                <Redirect to="/" />
            </Switch>
        );
    }
}

export default App;
