import React, { useState } from 'react';

export default function SignInForm(props) {
  //storing all form values in a single object for "convenience"
  const [formValues, setFormValues] = useState({
    'email': undefined,
    'password': undefined
  })

  //update state for specific field
  const handleChange = (event) => {
    let field = event.target.name; //which input
    let value = event.target.value; //what value

    let copy = {...formValues}
    copy[field] = value //change this field
    setFormValues(copy)
  }

  //handle signUp button
  const handleSignUp = (event) => {
    let email = formValues.email;
    let displayName = email.substring(0, email.indexOf("@"));
    event.preventDefault(); //don't submit
    props.signUpCallback(email, formValues.password, displayName);
  }

  //handle signIn button
  const handleSignIn = (event) => {
    event.preventDefault(); //don't submit
    props.signInCallback(formValues.email, formValues.password);
  }

  return (
    <form>
      {/* email */}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input className="form-control" 
          id="email" 
          type="email" 
          name="email"
          onChange={handleChange}
          />
      </div>
      
      {/* password */}
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input className="form-control" 
          id="password" 
          type="password"
          name="password"
          onChange={handleChange}
          />
      </div>

      {/* buttons */}
      <div className="form-group">
        <button className="btn btn-primary mr-2" onClick={handleSignUp}>Sign-up</button>
        <button className="btn btn-primary" onClick={handleSignIn}>Sign-in</button>
      </div>
    </form>
  )
}