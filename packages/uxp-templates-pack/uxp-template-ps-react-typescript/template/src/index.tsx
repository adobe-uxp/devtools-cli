import App from './App'
import ReactDOM from 'react-dom'
import React from 'react'

// Render dialog to DOM, this will show the UI in the container, like a panel
ReactDOM.render(<App />, document.getElementById('root'))

// Define entry points for Photoshop Panel Flyout Menu items
function flyoutMenuCommand1() {
  const psCore = require('photoshop').core
  psCore.showAlert({ message: 'Command 1 was invoked!' })
}

// tslint:disable-next-line: no-string-literal
window['flyoutMenuCommand1'] = flyoutMenuCommand1
