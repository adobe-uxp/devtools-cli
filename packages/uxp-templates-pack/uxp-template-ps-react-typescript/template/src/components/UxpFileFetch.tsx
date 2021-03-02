import React from 'react'

const psApp = require('photoshop').app

/**
 * Sample usage of UXP specific APIs; filesystem and
 * network APIs.
 */
export default class UxpFileFetch extends React.Component {
  private fetchInputRef: React.RefObject<HTMLInputElement>

  constructor(props) {
    super(props)
    this.fetchInputRef = React.createRef()
  }

  public render() {
    return (
      <div className="component">
        <h3 className="heading">UXP File, Fetch</h3>
        <div>
          <div className="element">
            <span>URL to fetch: </span>
            <input ref={this.fetchInputRef} type="text" placeholder="" />
            <button onClick={() => this.doFetch()}>fetch</button>
            <button onClick={() => this.doDownload()}>download</button>
          </div>
          <br />
          <div className="element">
            <button onClick={() => this.openFileDialog()}>
              Open with Photoshop...
            </button>
            <button onClick={() => this.saveFileDialog()}>
              Save current document...
            </button>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Perform a fetch on the provided URL. See UXP docs
   * for supported options. A modified XMLHttpRequest
   * is also available.
   */
  private async doFetch() {
    const url = this.fetchInputRef.current.value // URL input box contents
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
    try {
      const fetchRes = await window.fetch(url, options)
      console.log(fetchRes)
    } catch (e) {
      console.log(e.message || e)
    }
  }

  /**
   * Write to disk the body of a fetch response on to
   * a temporary folder designated by UXP. See UXP docs
   * for supported folder locations and APIs.
   */
  private async doDownload() {
    const tempFolder = await require('uxp').storage.localFileSystem.getTemporaryFolder()
    const tempFile = await tempFolder.createFile('output', { overwrite: true })

    const url = this.fetchInputRef.current.value // URL input box contents
    try {
      const fetchRes = await window.fetch(url, {})
      tempFile.write(await fetchRes.text())
      console.log(tempFile.nativePath)
    } catch (e) {
      console.log(e.message || e)
    }
  }

  /**
   * Trigger a UXP File Open dialog. Use the resulting
   * UXP.File entry to pass onto the Photoshop open API.
   * See UXP docs for more operations with UXP.File entries.
   */
  private async openFileDialog() {
    const imageFile = await require('uxp').storage.localFileSystem.getFileForOpening(
      { types: ['psd', 'psb'] }
    ) // as UXP.File
    if (imageFile) {
      try {
        await psApp.open(imageFile.nativePath)
      } catch (e) {
        console.log(e.message || e)
      }
    }
  }

  /**
   * Trigger a UXP File Save dialog. Use the resulting
   * UXP.File entry to pass onto the Photoshop save API.
   * See PS API docs for other options supported by doc.save().
   */
  private async saveFileDialog() {
    const activeDoc = await psApp.activeDocument
    const currentName = await activeDoc.title
    const imageFile = await require('uxp').storage.localFileSystem.getFileForSaving(
      currentName
    ) // as UXP.File
    if (imageFile) {
      try {
        await activeDoc.save(imageFile.nativePath) // simple save, file type inferred from path
      } catch (e) {
        console.log(e.message || e)
      }
    }
  }
}
