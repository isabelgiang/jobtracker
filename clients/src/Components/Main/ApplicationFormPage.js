import React, { useState } from 'react';
import { useParams, Redirect } from 'react-router-dom';
import Errors from '../Errors/Errors';
import Header from '../Header';

export default function applicationFormPage(props) {
    //storing all form values in a single object for "convenience"
    const [formValues, setFormValues] = useState({
      'stageType': 'Take Home',
      'stageDate': undefined,
      'durationMins': undefined,
      'notes': undefined
    });
    const [redirectBack, setRedirectBack] = useState(false);

    //update state for specific field
    const handleChange = (event) => {
      let field = event.target.name; //which input
      let value = event.target.value; //what value

      let copy = {...formValues}
      copy[field] = value //change this field
      // Convert duration into an integer
      if (field == "durationMins") {
          copy[field] = parseInt(value);
      }
      setFormValues(copy)
    }

    const handleSubmit = async (event) => {
        event.preventDefault(); //don't submit

        const response = await fetch(`https://api.jobtracker.fyi/v1/applications/${applicationID}/stages`, {
            method: "POST",
            body: JSON.stringify(formValues),
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
        const newStage = await response.json();
        setRedirectBack(true); // redirect back to application page
    }

    const StageTypes = [
        'Take Home',
        'Online Assessment',
        'Phone Screen',
        'Onsite',
        'Team Matching'
    ]
    const stageTypeFormOptions = StageTypes.map((stageType) => {
        return <option key={stageType}>{stageType}</option>
    })

    const urlParams = useParams();
    const applicationID = parseInt(urlParams.applicationID);

    if (redirectBack) {
        return <Redirect to={`/applications/${applicationID}`} />
    } else {
        return <>
            <Header {...props} />
            <div className="container px-5">
                <h2>Add Stage</h2>
                <form>
                    {/* stageType */}
                    <div className="form-group">
                        <label htmlFor="stagetype">Stage Type</label>
                        <select className="form-control"
                            id="stagetype"
                            name="stageType"
                            onChange={handleChange}
                            >
                                { stageTypeFormOptions }
                        </select>
                    </div>

                    {/* stageDate */}
                    <div className="form-group">
                        <label htmlFor="stagedate">Date</label>
                        <input className="form-control"
                            id="stagedate"
                            type="date"
                            name="stageDate"
                            onChange={handleChange}
                            />
                    </div>

                    {/* durationMins */}
                    <div className="form-group">
                    <label htmlFor="duration">Duration (Minutes)</label>
                    <input className="form-control"
                        id="duration"
                        type="number"
                        name="durationMins"
                        onChange={handleChange}
                        />
                    </div>

                    {/* notes */}
                    <div className="form-group">
                        <label htmlFor="notes">Notes</label>
                        <textarea className="form-control"
                            id="notes"
                            name="notes"
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

