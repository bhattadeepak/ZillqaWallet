import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

// Code-splitting is automated for routes
import Home from "./home";

export default class App extends Component {
  /** Gets fired when the route changes.
   *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
   *	@param {string} event.url	The newly routed URL
   */

  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    return (
      <div id="app">
        <Router onChange={this.handleRoute}>
          <Home path="/" />
        </Router>
      </div>
    );
  }
}
