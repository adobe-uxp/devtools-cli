// App imports
import React from 'react'
import ReactDOM from 'react-dom'
import './App.css'

import PsApi from './components/PsApi'
import Listener from './components/Listener'
import Elements from './components/Elements'
import UxpFileFetch from './components/UxpFileFetch'

export default class App extends React.Component {
  constructor(props) {
    super(props)
  }

  public renderDialog() {
    const dialogElement = document.createElement('dialog')
    document.appendChild(dialogElement)
    ReactDOM.render(<App />, dialogElement)
    dialogElement.addEventListener('close', () => {
      document.removeChild(dialogElement)
    })
    dialogElement.showModal()
  }

  public render() {
    return (
      <div className="panel">
        <h1>Photoshop UXP Starter Panel</h1>
        <PsApi />
        <Listener />
        <Elements />
        <UxpFileFetch />
        <button onClick={() => this.renderDialog()}>Render as a dialog</button>
      </div>
    )
  }
}
