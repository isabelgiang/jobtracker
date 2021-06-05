import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

export default function AddItemCard(props) {
    return (
        <div className="d-flex p-2 col-lg-4">
            <div className="card mx-2 my-4">
                <div className="card-body d-flex align-items-center justify-content-center">
                    <Link to={{
                        pathname: props.addPagePath,
                        state: {}
                    }}>
                        <h1><FontAwesomeIcon id="add-item-icon" icon={["fa", "plus"]} color="lightgray" /></h1>
                    </Link>
                </div>
            </div>
        </div>
    )
}
