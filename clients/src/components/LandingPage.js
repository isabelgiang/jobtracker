import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {

  return (
      <div id="landing-page-container">
        <main className="landing">
          <div>
            <h1 className="landing">JobTracker</h1>
            <h2 className="landing">JobTracker - Track Job Applications</h2>
            <Link to="/sign-in"><button className="btn btn-danger btn-lg" type="button">Get Started</button></Link>
          </div>
        </main>
      </div>
  )
}
// TODO: Add a grid of company logos
