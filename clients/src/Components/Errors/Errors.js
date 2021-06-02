import React from 'react';
import PropTypes from 'prop-types';
import './Styles/Errors.css';

const Errors = ({ error, setError }) => {
    switch (error) {
        case "":
            return <></>
        default:
            return <div className="error">
                <span className="error-hide" onClick={() => setError("")}>x</span>
                Error: {error}
            </div>
    }
}

Errors.propTypes = {
    error: PropTypes.string.isRequired,
    setError: PropTypes.func
}

export default Errors;