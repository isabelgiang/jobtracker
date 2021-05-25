import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {

  /*
  <div class="row">
    <div class="input-group input-group-lg col-4 offset-4">
      <input type="email" class="form-control" placeholder="Email address" aria-label="Email address" />
      <div class="input-group-append">
        <Link to="/trails"><button className="btn btn-danger btn-lg" type="button">Get Started</button></Link>
      </div>
    </div>
  </div>
  */

  return (
      <div id="landing-page-container">
        <main className="landing">
          <div>
            <h1 className="landing">Seattle Trail Finder<span role="img" id="tree" aria-label="tree">🌲</span></h1>
            <h2 className="landing">Find a low-traffic trail in Seattle</h2>
            <Link to="/sign-in"><button className="btn btn-danger btn-lg" type="button">Get Started</button></Link>
          </div>
        </main>
      </div>
  )
}