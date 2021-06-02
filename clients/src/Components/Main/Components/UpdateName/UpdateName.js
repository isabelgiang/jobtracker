import React, { Component } from 'react';
import api from '../../../../Constants/APIEndpoints/APIEndpoints';
import Errors from '../../../Errors/Errors';

class UpdateName extends Component {
    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            error: ''
        }
    }

    sendRequest = async (e) => {
        e.preventDefault();
        const { firstName, lastName } = this.state;
        const sendData = { firstName, lastName };
        const response = await fetch(api.base + api.handlers.myuser, {
            method: "PATCH",
            body: JSON.stringify(sendData),
            headers: new Headers({
                "Authorization": localStorage.getItem("Authorization"),
                "Content-Type": "application/json"
            })
        });
        if (response.status >= 300) {
            const error = await response.text();
            console.log(error);
            this.setError(error);
            return;
        }
        alert("Name changed") // TODO make this better by refactoring errors
        const user = await response.json();
        this.props.setUser(user);
    }

    setValue = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    setError = (error) => {
        this.setState({ error })
    }

    render() {
        const { firstName, lastName, error } = this.state;
        return <>
            <Errors error={error} setError={this.setError} />
            <div>Enter a new name</div>
            <form onSubmit={this.sendRequest}>
                <div>
                    <span>First name: </span>
                    <input name={"firstName"} value={firstName} onChange={this.setValue} />
                </div>
                <div>
                    <span>Last name: </span>
                    <input name={"lastName"} value={lastName} onChange={this.setValue} />
                </div>
                <input type="submit" value="Change name" />
            </form>
        </>
    }

}

export default UpdateName;