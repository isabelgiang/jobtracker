import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Button } from 'reactstrap';


export default function Dashboard(props) {
  return (
    <React.Fragment>
      <Header currentUser={props.currentUser} signOutCallback={props.signOutCallback} />
      <Applications applications={props.applications} currentUser={props.currentUser} />
    </React.Fragment>
  )
}

function Header(props) {
  return (
    <header className="jumbotron jumbotron-fluid text-white">
      <div className="container">
        <h1>JobTracker</h1>
        <p className="lead">JobTracker - Track Job Applications</p>
        <button id="logout" className="btn btn-warning" onClick={props.signOutCallback}>{`Log out ${props.currentUser.displayName}`}</button>
      </div>
    </header>
  )
}

function Applications(props) {
  let user = props.currentUser;

  let deck = props.applications.map((application) => {
    return <ApplicationCard application={application} currentUser={user} key={application.id} />;
  });

  return (
    <main>
      <div className="container">
        <h2>Applications</h2>
        <div className="card-deck">
          {deck}
        </div>
      </div>
    </main>
  );
}

function ApplicationCard(props) {
  let user = props.currentUser;
  let application = props.application;
  let imgSrc = 'img/'+application.image;
  let imgAlt = application.companyName + " image";

  const [redirectTo, setRedirectTo] = useState(undefined);

  const handleClick = () => {
    setRedirectTo(application.id);
  }

  if(redirectTo !== undefined) {
    return <Redirect push to={"/applications/" + redirectTo }/>
  }

  let statusBadgeClasses = undefined;
  let statusText = undefined;
  switch(application.status) {
    case 'Open':
      statusBadgeClasses = 'application-status badge badge-success';
      statusText = 'Open';
      break;
    case 'Interview':
      statusBadgeClasses = 'application-status badge badge-warning';
      statusText = 'Interview';
      break;
    case 'Rejected':
      statusBadgeClasses = 'application-status badge badge-danger';
      statusText = 'Rejected';
      break;
  }

  return (
    <div className="d-flex p-2 col-lg-4">
      <div key={application.id} className="card mx-2 my-4">
        <img className="card-img-top" src={imgSrc} alt={imgAlt} />
        <div className="card-body">
          <h3 className="card-title">{application.companyName}</h3>
          <span className={statusBadgeClasses}>{statusText}</span>
          <p className="card-text">{application.positionName}</p>
          <Button onClick = {handleClick} size="large" color="primary">View Details</Button>
        </div>
      </div>
    </div>
  );
}
