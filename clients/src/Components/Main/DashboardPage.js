import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { Button } from 'reactstrap';
import Header from '../Header';
import AddItemCard from './Components/AddItemCard'


export default function Dashboard(props) {
  const user = props.user;
  const [applications, setApplications] = useState(undefined);

  // Retrieve applications once on page start
  useEffect(() => {
    async function getApplicationsForUser() {
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
      setApplications(applications);
    }

    getApplicationsForUser();
  }, []);

  return (
    <React.Fragment>
      <Header user={props.user} signOutCallback={props.signOutCallback} />
      <Applications applications={applications} user={props.user} />
    </React.Fragment>
  )
}

function Applications(props) {
  let user = props.user;
  let applications = props.applications;

  let applicationDeck;
  if (applications) {
    applicationDeck = props.applications.map((application) => {
      return <ApplicationCard application={application} user={user} key={application.id} />;
    });
  } else {
    applicationDeck = <></>;
  }


  return (
    <main>
      <div className="container">
        <h2>My Applications</h2>
        <div className="card-deck">
          {applicationDeck}
          <AddItemCard itemType="application" />
        </div>
      </div>
    </main>
  );
}

function ApplicationCard(props) {
  let application = props.application;
  let imgSrc = application.image;
  let imgAlt = application.companyName + " image";

  const [redirectTo, setRedirectTo] = useState(undefined);

  const handleClick = () => {
    setRedirectTo(application.id);
  }

  if(redirectTo !== undefined) {
    return <Redirect push to={`/applications/${redirectTo}`} />
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

  let companyImage;
  if (!application.image) {
    companyImage = <img className="card-img-top" src={'img/default-company-image.png'} alt={"Default company image"} />
  } else {
    companyImage = <img className="card-img-top px-4 pt-5" src={imgSrc} alt={imgAlt} />
  }

  return (
    <div className="d-flex p-2 col-lg-4">
      <div key={application.id} className="card mx-2 my-4">
        {companyImage}
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
