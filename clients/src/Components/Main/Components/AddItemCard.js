import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

export default function AddItemCard(props) {
    let addItemPagePath;
    let addItemPageState;
    if (props.itemType == "application") {
        addItemPagePath = "/add-application";
        // TODO: addItemPageState
    } else if (props.itemType == "stage") {
        let applicationID = props.parentID;
        addItemPagePath = `/applications/${applicationID}/add-stage`;
        addItemPageState = {
            applicationID: applicationID,
            // Use empty strings instead of undefined to make these controlled components
            // https://reactjs.org/docs/forms.html#controlled-components
            initialValues: {
                "stageType": "",
                "stageDate": "",
                "durationMins": "",
                "notes": ""
            },
            requestMethod: "POST",
            endpoint: `https://api.jobtracker.fyi/v1/applications/${applicationID}/stages`
        };
    }

    return (
        <div className="d-flex p-2 col-lg-4">
            <div className="card mx-2 my-4">
                <div className="card-body d-flex align-items-center justify-content-center">
                    <Link to={{
                        pathname: addItemPagePath,
                        state: addItemPageState
                    }}>
                        <h1><FontAwesomeIcon id="add-item-icon" icon={["fa", "plus"]} color="lightgray" /></h1>
                    </Link>
                </div>
            </div>
        </div>
    )
}
