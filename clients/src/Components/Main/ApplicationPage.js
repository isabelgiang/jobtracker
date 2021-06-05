import React, {useState, useEffect} from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import Header from '../Header'
import AddItemCard from './Components/AddItemCard'

export default function ApplicationPage(props) {
  const urlParams = useParams();
  const applicationID = parseInt(urlParams.applicationID);
  let application =  _.find(props.applications, {id: parseInt(urlParams.applicationID)});


  const [stages, setStages] = useState(undefined);

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
      const stages = await response.json();
      setStages(stages);
    }

    getStagesForApplication();
  }, []);

  return (
    <>
    <Header user={props.user} signOutCallback={props.signOutCallback} />
    <div className="container">
      <h2>Application Details <FontAwesomeIcon id="edit-application" icon={['fa', 'pencil-alt']} size="xs" color="lightgray" onClick={()=>{console.log('clicked!')}}/></h2>
      <h3>{application.companyName}</h3>
      <h5>{application.positionName}</h5>
      <p><b>Status:</b> {application.status}</p>
    </div>
    <Stages applicationID={application.id} stages={stages} user={props.user}/>
    </>
  );
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
         <AddItemCard addPagePath={`/applications/${applicationID}/add-stage`} />
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

  const stageDateString = new Date(stage.stageDate).toLocaleDateString();
  const createdDateString = new Date(stage.createdDate).toLocaleString();
  const updatedDateString = new Date(stage.updatedDate).toLocaleString();

  return (
    <div className="d-flex p-2 col-lg-4">
      <div key={stage.id} className="card mx-2 my-4">
        <div className="card-body">
          <h3 className="card-title">{stage.stageType}</h3>
          <p className="card-text"><b>Date:</b> {stageDateString}</p>
          <p className="card-text"><b>Duration:</b> {stage.durationMins} minutes</p>
          <Button
            onClick = {toggle}
            size="large"
            color="primary"
            data-toggle="modal">View Details</Button>
          <Modal isOpen={modal} toggle={toggle} className='modal-dialog modal-dialog-centered modal-lg'>
            <ModalHeader toggle={toggle}>{stage.stageType}</ModalHeader>
            <ModalBody>
              <p><b>Date:</b> {stageDateString}</p>
              <p><b>Duration:</b> {stage.durationMins} minutes</p>
              <p><b>Notes:</b> {stage.notes}</p>
              <p><b>Created Date:</b> {createdDateString}</p>
              <p><b>Updated Date:</b> {updatedDateString}</p>
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
