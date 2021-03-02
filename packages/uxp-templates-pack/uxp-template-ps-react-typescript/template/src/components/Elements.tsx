import React from 'react'

/**
 * Contains simplified usage of User Interface elements
 * available in UXP-Photoshop. See the plugin docs for
 * more information.
 */
export default class Elements extends React.Component {
  constructor(props) {
    super(props)
  }

  public onDropdownChange(event) {
    console.log(event.target.value)
  }
  public onCheckboxChange(event) {
    console.log(event.target.value)
  }
  public onRangeChange(event) {
    console.log(event.target.value)
  }
  public onButtonClick(event) {
    console.log('button clicked')
  }
  public onInputChange(event) {
    console.log(event.target.value)
  }

  public render() {
    return (
      <div className="component">
        <h3 className="heading">UXP UI Elements</h3>
        <div>
          <div className="element flex-row between">
            <span>Links</span>
            <a
              className="links"
              href="https://adobe-photoshop.github.io/uxp-api-docs"
            >
              Learn more about Adobe Photoshop.
            </a>
          </div>
          <hr />
          <div className="element flex-row between">
            <span>Dropdown</span>
            <label>
              <select onChange={(e) => this.onDropdownChange(e)}>
                <option value="normal">Normal</option>
                <option value="dissolve">Dissolve</option>
                <option value="darken">Darken</option>
              </select>
            </label>
          </div>
          <hr />
          <div className="element flex-row between">
            <span>Range</span>
            <input
              onChange={(e) => this.onRangeChange(e)}
              type="range"
              min="0"
              max="100"
            />
          </div>
          <hr />
          <div className="element flex-row between">
            <span>Button</span>
            <button onClick={(e) => this.onButtonClick(e)}>Button</button>
          </div>
          <hr />
          <div className="element flex-row between">
            <span>Input</span>
            <input onChange={(e) => this.onInputChange(e)} type="text" />
          </div>
          {/* <span>Tooltips</span>
          <span title="Tooltips">Hover over Tooltip</span> */}
          {/* <label>
            <span>Checkbox</span>
            <input onChange={(e) => this.onCheckboxChange(e)} type="checkbox"/>
          </label> */}
        </div>
      </div>
    )
  }
}
