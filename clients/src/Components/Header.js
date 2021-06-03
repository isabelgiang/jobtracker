export default function Header(props) {
    let logoutButton;
    if (props.user) {
        logoutButton = <button id="logout" className="btn btn-warning mt-2" onClick={props.signOutCallback}>{`Log out ${props.user.userName}`}</button>;
    } else {
        logoutButton = <></>;
    }

    return (
      <header className="jumbotron jumbotron-fluid text-white">
        <div className="container">
            <h1>JobTracker</h1>
            <p className="lead">JobTracker - A Better Way to Track Job Applications</p>
            {logoutButton}
        </div>
      </header>
    )
  }
