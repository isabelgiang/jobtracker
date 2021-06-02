import React from 'react';
import _ from 'lodash';
import { useParams } from 'react-router-dom';

export default function ApplicationPage(props) {
  const urlParams = useParams();
  let application =  _.find(props.applications, {id: parseInt(urlParams.applicationID)});

  return (
    <div>
      <h2>{application.companyName}</h2>
      <p>{application.positionName}</p>
    </div>
  );
}
