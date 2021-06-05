import React, { useState } from 'react';
import { useLocation, Redirect } from 'react-router-dom';
import Errors from '../Errors/Errors';
import Header from '../Header';

export default function AddEditApplicationPage(props) {
    const Statuses = [
        "Applied",
        "Interviewing",
        "Withdrew",
        "Offer",
        "Rejected",
        "Ghosted"
    ]

    // Set initial form state, request details, page heading based on info passed from referrer
    const location = useLocation();
    const { initialValues, requestMethod, endpoint } = location.state;
    initialValues.status = initialValues.status || Statuses[0];

    const [formValues, setFormValues] = useState(initialValues);
    const [redirectBack, setRedirectBack] = useState(false);

    const pageHeading = location.pathname.includes("edit") ? "Edit Application" : "Add Application";

    //update state for specific field
    const handleChange = (event) => {
      let field = event.target.name; //which input
      let value = event.target.value; //what value

      let copy = {...formValues}
      copy[field] = value //change this field
      setFormValues(copy)
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Do some data processing before submitting if needed
        let sendData = {...formValues};
        console.log(`The data to be sent is ${JSON.stringify(sendData)}`);

        const response = await fetch(endpoint, {
            method: requestMethod,
            body: JSON.stringify(sendData),
            headers: new Headers({
                "Authorization": localStorage.getItem("Authorization"),
                "Content-Type": "application/json",
            })
        });
        if (response.status >= 300) {
            const error = await response.text();
            //this.setError(error);
            return;
        }
        //this.setError("");
        const newApplication = await response.json();
        setRedirectBack(true); // redirect back to application page
    }

    const statusFormOptions = Statuses.map((status) => {
        return <option key={status}>{status}</option>
    })

    if (redirectBack) {
        return <Redirect to={`/dashboard`} />
    } else {
        return <>
            <Header {...props} />
            <div className="container px-5">
                <h2>{pageHeading}</h2>
                <form>
                    {/* companyName */}
                    <div className="form-group">
                        <label htmlFor="companyname">Company Name</label>
                        <input className="form-control"
                            id="companyname"
                            type="text"
                            name="companyName"
                            value={formValues.companyName}
                            onChange={handleChange}
                            />
                    </div>

                    {/* positionName */}
                    <div className="form-group">
                        <label htmlFor="positionname">Position Name</label>
                        <input className="form-control"
                            id="positionname"
                            type="text"
                            name="positionName"
                            value={formValues.positionName}
                            onChange={handleChange}
                            />
                    </div>

                    {/* positionURL */}
                    <div className="form-group">
                        <label htmlFor="positionurl">Position URL</label>
                        <input className="form-control"
                            id="positionurl"
                            type="text"
                            name="positionURL"
                            value={formValues.positionURL}
                            onChange={handleChange}
                            />
                    </div>

                     {/* location */}
                    <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input className="form-control"
                            id="location"
                            type="text"
                            name="location"
                            value={formValues.location}
                            onChange={handleChange}
                            />
                    </div>

                    {/* status */}
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select className="form-control"
                            id="status"
                            name="status"
                            value={formValues.status}
                            onChange={handleChange}
                            >
                                { statusFormOptions }
                        </select>
                    </div>

                    {/* dateApplied */}
                    <div className="form-group">
                        <label htmlFor="dateapplied">Date Applied</label>
                        <input className="form-control"
                            id="dateapplied"
                            type="date"
                            name="dateApplied"
                            value={formValues.dateApplied ? new Date(formValues.dateApplied).toISOString().substr(0, 10) : formValues.dateApplied}
                            onChange={handleChange}
                            />
                    </div>

                    {/* dateReplied */}
                    <div className="form-group">
                        <label htmlFor="datereplied">Date Replied</label>
                        <input className="form-control"
                            id="datereplied"
                            type="date"
                            name="dateReplied"
                            value={formValues.dateReplied ? new Date(formValues.dateReplied).toISOString().substr(0, 10) : formValues.dateReplied}
                            onChange={handleChange}
                            />
                    </div>

                    {/* buttons */}
                    <div className="form-group">
                        <button className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                    </div>
                </form>
            </div>
        </>
    }
}
