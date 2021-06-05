import React, {useState, useEffect} from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import Header from '../Header'
import AddItemCard from './Components/AddItemCard'

// Convert DB timstamp from UTC
function displayTimestamp(utcDateString) {
  return new Date(utcDateString).toLocaleString();
}

// Manual date formatting to match locale string
function displayDate(dateString) {
  const date = new Date(dateString);
  return `${date.getUTCMonth()+1}/${date.getUTCDate()}/${date.getFullYear()}`;
}

export default function ApplicationPage(props) {
  const user = props.user;
  const { applicationID } = useParams();

  const [application, setApplication] = useState(undefined);
  const [stages, setStages] = useState(undefined);
  const [applicationReady, setApplicationReady] = useState(false);
  const [stagesReady, setStagesReady] = useState(false)

  useEffect(() => {
    async function getApplication() {
      // Get all applications for a user for now until request to get single application works
      const response = await fetch(`https://api.jobtracker.fyi/v1/applications?userid=${user.id}`, {
          method: "GET",
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
      const applications = await response.json();

      // Search for application with the correct applicationID within all applications
      const currentApplication = _.find(applications, {id: parseInt(applicationID)});
      setApplication(currentApplication);
      setApplicationReady(true);
    }

    getApplication();
  }, []);

  // Retrieve stages once on page start
  useEffect(() => {
    async function getStagesForApplication() {
      const response = await fetch(`https://api.jobtracker.fyi/v1/applications/${applicationID}/stages`, {
          method: "GET",
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
      const currentStages = await response.json();
      setStages(currentStages);
      setStagesReady(true);
    }

    getStagesForApplication();
  }, []);

  if(applicationReady && stagesReady) {
    return (
      <>
        <Header user={props.user} signOutCallback={props.signOutCallback} />
        <div className="container">
          <h2>Application Details <FontAwesomeIcon id="edit-application" icon={['fa', 'pencil-alt']} size="xs" color="lightgray" onClick={()=>{console.log('clicked!')}}/></h2>
          <h3>{application.companyName}</h3>
          <h5 className="mt-4 mb-5"><i>{application.positionName}</i></h5>
          <p><b>PositionURL:</b> {application.positionURL}</p>
          <p><b>Location:</b> {application.location}</p>
          <p><b>Status:</b> {application.status}</p>
          <p><b>Date Applied:</b> {displayDate(application.dateApplied)}</p>
          <p><b>Date Replied:</b> {displayDate(application.dateReplied)}</p>
          <p><b>Created Date:</b> {displayTimestamp(application.createdDate)}</p>
          <p><b>Updated Date:</b> {displayTimestamp(application.updatedDate)}</p>
        </div>
        <Stages applicationID={applicationID} stages={stages} user={props.user}/>
      </>
    );
  } else {
    return <>Loading...</>
  }
}

function Stages(props) {
  let { applicationID, user, stages } = props;
  let stageDeck;
  if (stages) {
    stageDeck = props.stages.map((stage) => {
      return <StageCard applicationID={applicationID} stage={stage} user={user} key={stage.id} />;
    });
  } else {
    stageDeck = <></>;
  }

  return (
    <main>
      <div className="container">
        <h2>Stages</h2>
        <div className="card-deck">
          {stageDeck}
         <AddItemCard itemType='stage' parentID={applicationID} />
        </div>
      </div>
    </main>
  );
}

function StageCard(props) {
  let applicationID = props.applicationID;
  let stage = props.stage;

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  return (
    <div className="d-flex p-2 col-lg-4">
      <div key={stage.id} className="card mx-2 my-4">
        <div className="card-body">
          <h3 className="card-title">{stage.stageType}</h3>
          <p className="card-text"><b>Date:</b> {displayDate(stage.stageDate)}</p>
          <p className="card-text"><b>Duration:</b> {stage.durationMins} minutes</p>
          <Button
            onClick = {toggle}
            size="large"
            color="primary"
            data-toggle="modal">View Details</Button>
          <Modal isOpen={modal} toggle={toggle} className='modal-dialog modal-dialog-centered modal-lg'>
            <ModalHeader toggle={toggle}>{stage.stageType}</ModalHeader>
            <ModalBody>
              <p><b>Date:</b> {displayDate(stage.stageDate)}</p>
              <p><b>Duration:</b> {stage.durationMins} minutes</p>
              <p><b>Notes:</b> {stage.notes}</p>
              <p><b>Created Date:</b> {displayTimestamp(stage.createdDate)}</p>
              <p><b>Updated Date:</b> {displayTimestamp(stage.updatedDate)}</p>
            </ModalBody>
            <ModalFooter>
              <Link to={{
                pathname: `/stages/${stage.id}/edit`,
                state: {
                  applicationID: applicationID,
                  initialValues: stage,
                  requestMethod: 'PATCH',
                  endpoint: `https://api.jobtracker.fyi/v1/stages/${stage.id}`
                }
              }}>
                <Button color="primary" onClick={toggle}>Edit</Button>
              </Link>
              {' '}
              <Button color="secondary" onClick={toggle}>Cancel</Button>
            </ModalFooter>
          </Modal>
        </div>
      </div>
    </div>
  );
}
