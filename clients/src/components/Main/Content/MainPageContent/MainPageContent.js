import React, { useState, useEffect } from 'react';
import PageTypes from '../../../../Constants/PageTypes/PageTypes';
import './Styles/MainPageContent.css';
import api from '../../../../Constants/APIEndpoints/APIEndpoints';

const MainPageContent = ({ user, setPage }) => {
    const [avatar, setAvatar] = useState(null)

    async function fetchAvatar() {
        const response = await fetch(api.base + api.handlers.myuserAvatar, {
            method: "GET",
            headers: new Headers({
                "Authorization": localStorage.getItem("Authorization")
            })
        });
        if (response.status >= 300) {
            // const error = await response.text();
            setAvatar(user.photoURL)
            return;
        }
        const imgBlob = await response.blob();
        setAvatar(URL.createObjectURL(imgBlob));
    }

    useEffect(() => {
        fetchAvatar();
        return;
    }, []);

    return <>
        <div>Welcome to my application, {user.firstName} {user.lastName}</div>

        {avatar && <img className={"avatar"} src={avatar} alt={`${user.firstName}'s avatar`} />}
        <div><button onClick={(e) => { setPage(e, PageTypes.signedInUpdateName) }}>Update name</button></div>
        <div><button onClick={(e) => { setPage(e, PageTypes.signedInUpdateAvatar) }}>Update avatar</button></div>
    </>
}

export default MainPageContent;