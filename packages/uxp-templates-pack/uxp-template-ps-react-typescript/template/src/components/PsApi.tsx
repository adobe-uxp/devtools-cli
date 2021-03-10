import React from 'react'

interface AppState {
  consoleLines: string[]
}
import photoshop from 'photoshop'
const psApp = photoshop.app

/**
 * Sample usage of Photoshop DOM APIs.
 */
export default class PsApi extends React.Component<{}, AppState> {
  private consoleRef: React.RefObject<HTMLInputElement>

  constructor(props) {
    super(props)
    this.state = {
      consoleLines: [],
    }

    this.consoleRef = React.createRef()
  }

  public render() {
    return (
      <div className="component">
        <h3 className="heading">PS Api Usage</h3>
        <div className="element">
          <button onClick={() => this.printDocuments()}>app.documents</button>
          <button onClick={() => this.printLayers()}>activeDoc.layers</button>
          <button onClick={() => this.flipVisibility()}>flip visibility</button>
          <button onClick={() => this.resizeActiveDocument(0.75)}>
            resize (75%)
          </button>
          <button onClick={() => this.saveDialog()}>open save dialog</button>
          <button onClick={() => this.showAlert('Alert!')}>show alert</button>
        </div>
        <a className="links" onClick={() => this.clearLines()}>
          Console clear
        </a>
        <div ref={this.consoleRef} className="scrollable-console">
          <ul>
            {this.state.consoleLines.map((line, i) => {
              return <li key={i}>{line}</li>
            })}
          </ul>
        </div>
      </div>
    )
  }

  /**
   * Enumerate the currently opened documents in
   * Photoshop, and print their titles onto the panel.
   */
  private printDocuments() {
    const docs = psApp.documents
    const names = docs.map((doc) => doc.title)

    this.addLines(names)
  }

  /**
   * Enumerate the layers in the active document in
   * a flattened list, and print their names onto the
   * panel.
   */
  private printLayers() {
    const activeDoc = psApp.activeDocument
    const names = activeDoc.layers.map((layer) => layer.name)

    this.addLines(names)
  }

  /**
   * Toggle the visibility property of each layer in
   * the current active document.
   */
  private flipVisibility() {
    const activeDoc = psApp.activeDocument

    activeDoc.layers.forEach((layer) => {
      layer.visible = !layer.visible
    })
  }

  /**
   * Retrieve the dimensions of the active document
   * and resize each by a factor.
   */
  private async resizeActiveDocument(percent: number) {
    const activeDoc = psApp.activeDocument
    const newWidth = activeDoc.width * percent
    const newHeight = activeDoc.height * percent
    await activeDoc.resizeImage(newWidth, newHeight)
  }

  /**
   * Request (if necessary) a save dialog in Photoshop
   * for the current active document. See the Photoshop
   * API docs for more options for doc.save().
   */
  private async saveDialog() {
    await psApp.activeDocument.save()
  }

  /**
   * Display a simple alert dialog in Photoshop.
   */
  private async showAlert(message: string) {
    await psApp.showAlert(message)
  }

  /**
   * Util function.
   */
  private addLines(lines: string[]) {
    this.setState((prevState) => {
      return {
        consoleLines: prevState.consoleLines.concat(lines),
      }
    })
    const scrollToBottom = (e) => {
      e.scrollTo(0, e.scrollHeight + e.offsetHeight)
    }
    scrollToBottom(this.consoleRef.current)
  }

  /**
   * Util function.
   */
  private clearLines() {
    this.setState({ consoleLines: [] })
  }
}
