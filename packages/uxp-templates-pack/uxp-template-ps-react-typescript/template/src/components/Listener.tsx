import React from 'react'

interface AppState {
  listening: boolean
  count: {
    all: number
  }
}

/**
 * Usage of the Photoshop event listening APIs.
 * This section of the APIs are subject to sweeping changes.
 */
export default class ListenerComponent extends React.Component<{}, AppState> {
  constructor(props) {
    super(props)
    this.state = {
      listening: false,
      count: {
        all: 0,
      },
    }

    this.listener = this.listener.bind(this)
  }

  public render() {
    const eventKeys = Object.keys(this.state.count)
    return (
      <div className="component">
        <h3 className="heading">Event listener</h3>
        <div className="flex-row between">
          <div>
            <p>Num events ($All): {this.state.count.all}</p>
            <p>Num event types: {eventKeys.length - 1}</p>
          </div>
          <div className="flex-row end">
            <div>
              <button onClick={() => this.attachListener()}>start</button>
              <button onClick={() => this.removeListener()}>stop</button>
              <button onClick={() => this.resetCounts()}>reset count</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Listener to be attached to all Photoshop notifications.
   */
  public async listener(event: string, message: object) {
    this.setState((prevState) => {
      return {
        count: {
          ...prevState.count,
          all: prevState.count.all + 1,
          [event]: prevState.count[event] + 1 || 1,
        },
      }
    })
  }

  /**
   * Attaches the simple listener to the app.
   */
  private async attachListener() {
    const app = require('photoshop').app
    app.eventNotifier = this.listener

    this.setState({ listening: true })
  }

  /**
   * Attaches a null listener to the app.
   */
  private async removeListener() {
    const app = require('photoshop').app
    app.eventNotifier = undefined

    this.setState({
      listening: false,
    })
  }

  /**
   * Util function.
   */
  private async resetCounts() {
    this.setState({
      count: { all: 0 },
    })
  }
}
