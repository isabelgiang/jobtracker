import React, { Component } from 'react';
import api from '../../../../Constants/APIEndpoints/APIEndpoints';
import Errors from '../../../Errors/Errors';

class UpdateAvatar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            error: ''
        }
    }

    sendRequest = async (e) => {
        e.preventDefault();
        const { file } = this.state;
        let data = new FormData()
        data.append('uploadfile', file);
        const response = await fetch(api.base + api.handlers.myuserAvatar, {
            method: "PUT",
            body: data,
            headers: new Headers({
                "Authorization": localStorage.getItem("Authorization"),
            })
        });
        if (response.status >= 300) {
            const error = await response.text();
            console.log(error);
            this.setError(error);
            return;
        }
        alert("Avatar changed"); // TODO make this better by refactoring errors
    }

    handleFile = (e) => {
        this.setState({
            file: e.target.files[0]
        })
    }

    setError = (error) => {
        this.setState({ error })
    }

    render() {
        const { error } = this.state;
        return <>
            <Errors error={error} setError={this.setError} />
            <div>Give yourself a new avatar</div>
            <form onSubmit={this.sendRequest}>
                <div>
                    <span>Upload new avatar </span>
                    <input type="file" onChange={this.handleFile} />
                </div>
                <input type="submit" value="Change avatar" />
            </form>
        </>
    }

}

export default UpdateAvatar;