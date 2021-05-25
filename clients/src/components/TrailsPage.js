import firebase from 'firebase/app';
import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { Button } from 'reactstrap';


export default function TrailsPage(props) {
  return (
    <React.Fragment>
      <Header currentUser={props.currentUser} signOutCallback={props.signOutCallback} />
      <TrailResults trails={props.trails} currentUser={props.currentUser} />
      <Footer />
    </React.Fragment>
  )
}

function Header(props) {
  return (
    <header className="jumbotron jumbotron-fluid bg-dark text-white">
      <div className="container">
        <h1>Seattle Trail Finder</h1>
        <p className="lead">If you are looking for a trail with low traffic, use our website
          to get some suggestions for trails in Seattle!
        </p>
        <button id="logout" className="btn btn-warning" onClick={props.signOutCallback}>{`Log out ${props.currentUser.displayName}`}</button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="container">
      <small>Data from <a href="https://www.seattle.gov/transportation/projects-and-programs/programs/bike-program/bike-counters?fbclid=IwAR3copSZvbf_CzzlbkfLm_q49LUp1y9djxjn6MyGpeKiZZlq5AAS2ZRdUhc"> Seattle Department of Transportation</a></small>
      <small>Images from <a href ="https://unsplash.com/photos/s84wh6ipibk"> Raquel Pedrotti</a></small>
    </footer>
  )
}

function TrailResults(props) {
  const [userFavorites, setUserFavorites] = useState({});
  let user = props.currentUser;

  useEffect(() => {
    let userFavoritesRef = firebase.database().ref(`userFavorites/${user.uid}`);
    userFavoritesRef.on('value', (snapshot) => {
      let faves = snapshot.val();
      if (faves != null && faves != undefined) {
        setUserFavorites(snapshot.val());
      }
    });
    return function cleanup() {
      userFavoritesRef.off();
    }
  });

  let deck = props.trails.map((trail) => {
    return <TrailCard trail={trail} currentUser={user} userFavorited={userFavorites[trail.id]} key={trail.trailName} />;
  });

  return (
    <main>
      <div className="container">
        <h2>Results</h2>
        <div className="card-deck">
          {deck}
        </div>
      </div>
    </main>
  );
}

function TrailCard(props) {
  let user = props.currentUser;
  let trail = props.trail;
  let imgSrc = 'img/'+trail.image;
  let imgAlt = trail.trailName + " image";

  const [redirectTo, setRedirectTo] = useState(undefined);
  const [favorited, setFavorited] = useState(props.userFavorited);

  useEffect(() => {
    let userFavoritedRef = firebase.database().ref(`userFavorites/${user.uid}/${trail.id}`);
    userFavoritedRef.on('value', (snapshot) => {
      setFavorited(snapshot.val());
    });
    return function cleanup() {
      userFavoritedRef.off();
    }
  });

  const handleClick = () => {
    setRedirectTo(trail.trailName);
  }

  if(redirectTo !== undefined) {
    return <Redirect push to={"/trails/" + redirectTo }/>
  }

  function toggleFavorite() {
    let userFavoritedRef = firebase.database().ref(`userFavorites/${user.uid}/${trail.id}`);
    if (favorited) {
      userFavoritedRef.set(false);
    } else {
      userFavoritedRef.set(true);
    }
  }

  function getTrailStatus() {
    let avgTraffic = trail.avgTraffic;
  
    if (avgTraffic < 30) {
      return 'low';
    } else if (avgTraffic < 50) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  let statusBadgeClasses = undefined;
  let statusText = undefined;
  switch(getTrailStatus()) {
    case 'low':
      statusBadgeClasses = 'trail-status badge badge-success';
      statusText = 'Low Traffic';
      break;
    case 'medium':
      statusBadgeClasses = 'trail-status badge badge-warning';
      statusText = 'Medium Traffic';
      break;
    case 'high':
      statusBadgeClasses = 'trail-status badge badge-danger';
      statusText = 'High Traffic';
      break;
  }

  return (
    <div className="d-flex p-2 col-lg-4">
      <div key={trail.trailName} className="card mx-2 my-4">
        <img className="card-img-top" src={imgSrc} alt={imgAlt} />
        <i className={'fa fa-heart fa-lg m-2 heart '+(favorited ? 'favorited': '')} aria-label="add to favorites" onClick={toggleFavorite} ></i>
        <div className="card-body">
          <h3 className="card-title">{trail.trailName}</h3>
          <div>
            <i className='fa fa-star-o fa-lg' aria-label="star rating"></i>
            <i className='fa fa-star-o fa-lg' aria-label="star rating"></i>
            <i className='fa fa-star-o fa-lg' aria-label="star rating"></i>
            <i className='fa fa-star-o fa-lg' aria-label="star rating"></i>
            <i className='fa fa-star-o fa-lg' aria-label="star rating"></i>
            <span> (No ratings)</span>
          </div>
          <span className={statusBadgeClasses}>{statusText}</span>
          <p className="card-text">{trail.address}</p>
          <Button onClick = {handleClick} size="large" color="primary">More Information</Button>
        </div>
      </div>
    </div>
  );
}