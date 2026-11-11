/* global
  HTMLElement,
  screen,
*/

(/** @param {Document} document */function (document) {
  class Validators {
    /**
     * @public
     * @param {*} something
     * @returns {boolean}
     */
    static nonEmptyString (something) {
      return typeof something === 'string' && something.length > 0
    }
  }

  class DateTimeUtils {
    /**
     * @type {number}
     */
    static SECS_PER_DAY = 86400

    /**
     * Truncates in-place
     *
     * @private
     * @static
     * @param {Date} date
     * @return {Date}
     */
    static truncate (date) {
      date.setHours(0, 0, 0, 0)

      return date
    }

    /**
     * Creates a new `Date` with its time set to "00:00:00.00"
     *
     * @private
     * @static
     * @returns {Date}
     */
    static yesterday () {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      return this.truncate(date)
    }

    /**
     * Creates a new `Date` with its time set to "00:00:00.00"
     *
     * @private
     * @static
     * @returns {Date}
     */
    static today () {
      return this.truncate(new Date())
    }

    /**
     * Creates a new `Date` with its time set to "00:00:00.00"
     *
     * @private
     * @static
     * @returns {Date}
     */
    static tomorrow () {
      const date = new Date()
      date.setDate(date.getDate() + 1)

      return this.truncate(date)
    }

    /**
     * @public
     * @static
     * @param {Date} date
     * @returns {boolean}
     */
    static dateIsToday (date) {
      const dateTs = date.getTime()

      return dateTs >= this.today().getTime() &&
        dateTs < this.tomorrow().getTime()
    }

    /**
     * @public
     * @static
     * @param {Date} date
     * @returns {boolean}
     */
    static dateIsYesterday (date) {
      const dateTs = date.getTime()

      return dateTs >= this.yesterday().getTime() &&
        dateTs < this.today().getTime()
    }
  }

  class DomHelper {
    /**
     * @public
     * @param {Document} document
     */
    constructor (document) {
      this.document = document
    }

    /**
     * @public
     * @param {string} css
     */
    addStylesheet (css) {
      const styleElem = this.document.head.appendChild(this.document.createElement('style'))
      styleElem.innerHTML = css
    }

    /**
     * @public
     * @param {string} method
     * @param {string} html
     * @param {Element} destElem
     */
    attachHtmlTo (method, html, destElem) {
      const templateElem = destElem.appendChild(destElem.ownerDocument.createElement('template'))
      templateElem.innerHTML = html
      destElem[method](templateElem.content)
      templateElem.remove()
    }
  }

  class HtmlUtils {
    /**
     * @public
     * @param {string} block
     * @param {string} [element]
     * @param {string} [modifier]
     * @returns {string}
     */
    static bem (block, element, modifier) {
      let name = `${block}`

      if (Validators.nonEmptyString(element)) {
        name += `__${element}`
      }

      if (Validators.nonEmptyString(modifier)) {
        name += `--${modifier}`
      }

      return name
    }

    /**
     * See https://stackoverflow.com/a/19842865/1063649
     *
     * @public
     * @param {string} [prefix]
     * @returns {string}
     */
    static uniqid (prefix = '') {
      return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2)
    }
  }

  class EventDecorator {
    /**
     * @public
     * @param {Event} e
     */
    constructor (e) {
      this.event = e
    }

    /**
     * @public
     * @param {HTMLElement|string} selector
     * @param {number} [depth = 1]
     * @returns {HTMLElement|null}
     */
    getActionTarget (selector, depth = 1) {
      let targetElem = this.getTarget()

      do {
        if (
          (selector instanceof HTMLElement && targetElem === selector) ||
          (typeof selector === 'string' && targetElem.matches(selector))
        ) {
          return targetElem
        }

        targetElem = targetElem.parentElement
        depth -= 1
      } while (depth >= 0 && targetElem !== null)

      return null
    }

    /**
     * @public
     * @param {number} [depth = 1]
     * @returns {HTMLAnchorElement|null}
     */
    getAnchorTarget (depth = 1) {
      return this.getActionTarget('a', depth)
    }

    /**
     * @private
     * @returns {EventTarget|HTMLElement}
     */
    getTarget () {
      return this.event.target
    }
  }

  /**
   * @abstract
   */
  class AbstractComponent {
    /**
     * @public
     * @param {HTMLElement} rootElem
     * @param {string} blockName
     */
    constructor (rootElem, blockName) {
      this.setComponents()

      this.setRootElem(rootElem)
      this.setBlockName(blockName)

      this.setDomHelper(new DomHelper(this.getDocument()))

      this.addClassBem()
    }

    /**
     * Call when you're ready to render the GUI
     *
     * @public
     */
    setUp () {
    }

    /**
     * @private
     * @param {object} [components]
     */
    setComponents (components = {}) {
      this.components = components
    }

    /**
     * @protected
     * @param {string} id
     * @param {AbstractComponent} component
     */
    setComponent (id, component) {
      this.components[id] = component
    }

    /**
     * @protected
     * @param {string} id
     * @returns {AbstractComponent}
     * @throws {Error} If the specified component doesn't exist
     */
    getComponent (id) {
      if (!(id in this.components)) {
        throw new Error(`The component, \`${id}\`, doesn't exist`)
      }

      return this.components[id]
    }

    /**
     * @private
     * @param {HTMLElement} elem
     */
    setRootElem (elem) {
      this.rootElem = elem
    }

    /**
     * @public
     * @returns {HTMLElement}
     */
    getRootElem () {
      return this.rootElem
    }

    /**
     * @private
     * @param {DomHelper} domHelper
     */
    setDomHelper (domHelper) {
      this.domHelper = domHelper
    }

    /**
     * @protected
     * @returns {DomHelper}
     */
    getDomHelper () {
      return this.domHelper
    }

    /**
     * @protected
     * @param {HTMLElement|string} elemOrTagName
     * @returns {HTMLElement}
     */
    appendChild (elemOrTagName) {
      const childElem = typeof elemOrTagName === 'string'
        ? this.getDocument().createElement(elemOrTagName)
        : elemOrTagName

      return this.getRootElem().appendChild(childElem)
    }

    /**
     * @private
     * @param {string} name
     */
    setBlockName (name) {
      this.blockName = name
    }

    /**
     * @private
     * @returns {string}
     */
    getBlockName () {
      return this.blockName
    }

    /**
     * @protected
     * @param {string} [element]
     * @param {string} [modifier]
     * @returns {string}
     */
    bem (
      element = '',
      modifier = ''
    ) {
      return HtmlUtils.bem(this.getBlockName(), element, modifier)
    }

    /**
     * @protected
     * @param {string} [element]
     * @param {string} [modifier]
     * @returns {HTMLElement|null}
     */
    queryBem (
      element = '',
      modifier = ''
    ) {
      const rootElem = this.getRootElem()

      return element === '' && modifier === ''
        ? rootElem
        : rootElem.querySelector('.' + this.bem(element, modifier))
    }

    /**
     * @protected
     * @param {string} [element]
     * @param {string} [modifier]
     */
    addClassBem (
      element = '',
      modifier = ''
    ) {
      this.getRootElem().classList.add(this.bem(element, modifier))
    }

    /**
     * @protected
     * @returns {Document}
     */
    getDocument () {
      return this.getRootElem().ownerDocument
    }

    /**
     * @protected
     * @returns {Window}
     */
    getWindow () {
      return this.getDocument().defaultView
    }
  }

  /**
   * Note:
   * - Aim to use Font Awesome Sharp Regular
   * - Paths in SVGs have `fill="currentColor"`
   * - Some SVGs have class-names
   */
  class Images {
    /**
     * @public
     * @constant
     * @type {string}
     */
    static ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Pro v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M288 96L128 96L128 544L288 544L288 96zM512 96L352 96L352 544L512 544L512 96z"/></svg>'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ICON_PLAY = '<svg class="stw-icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Pro v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 80L128 560L560 320L128 80z"/></svg>'

    /**
     * circle-info
     *
     * @public
     * @constant
     * @type {string}
     */
    static ICON_NOTICE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Pro v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM280 400L304 400L304 336L256 336L256 288L352 288L352 400L384 400L384 448L256 448L256 400L280 400zM352 256L288 256L288 192L352 192L352 256z"/></svg>'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ICON_EXPAND = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Pro v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M232 96L256 96L256 144L144 144L144 256L96 256L96 96L232 96zM96 408L96 384L144 384L144 496L256 496L256 544L96 544L96 408zM520 96L544 96L544 256L496 256L496 144L384 144L384 96L520 96zM496 408L496 384L544 384L544 544L384 544L384 496L496 496L496 408z"/></svg>'

    /**
     * compress
     *
     * @public
     * @constant
     * @type {string}
     */
    static ICON_COLLAPSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Pro v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M256 120L256 96L208 96L208 208L96 208L96 256L256 256L256 120zM120 384L96 384L96 432L208 432L208 544L256 544L256 384L120 384zM432 120L432 96L384 96L384 256L544 256L544 208L432 208L432 120zM408 384L384 384L384 544L432 544L432 432L544 432L544 384L408 384z"/></svg>'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static SRC_STW_LOGO = 'data:image/svg+xml;base64,PHN2ZyBpZD0iR3JleSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTc5LjcyIiBoZWlnaHQ9IjE1Ljk5IiB2aWV3Qm94PSIwIDAgMTc5LjcyIDE1Ljk5Ij48ZGVmcz48c3R5bGU+LmNscy0xLC5jbHMtMntmaWxsOiNlZDI1NTk7fS5jbHMtMXtmaWxsLXJ1bGU6ZXZlbm9kZDt9LmNscy0ze2ZpbGw6IzNiNDI0OTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPnNlZXRoZXdvcmxkLWxvZ288L3RpdGxlPjxnIGlkPSJzZWUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIxLDEzLjI3YTIuODYsMi44NiwwLDAsMS0yLjY3LDIuNDZIOC4xNmMtLjg3LS4xNS0yLjQ1LS45NC0yLjUzLTJhMTUuMDYsMTUuMDYsMCwwLDAsNS4wNiwxLjQ1YzIuNjcsMCw4LjE2LTIuMzksMTAuMzMtNC4zM1pNMTguMTMuMjdDMTkuNDMuNDIsMjEsMSwyMSwyLjUxVjguMzZjLTEuNDUsMi43NS03Ljg4LDUuMjctMTAuNCw1LjI3QzcuOCwxMy42MywyLDEwLjQ1LDAsNy44NWwxLjA4LS4yMWMuMzYtLjA4LjczLS4yOSwxLjA5LS4zNkM0LjY5LDYuNDgsOCwyLjQ0LDEwLjExLDIuNDRjMS41OSwwLDYuNTcsMi4yNCw2LjU3LDQuODRTMTIsMTAuNzQsMTEuMDUsMTAuNzRBMi43MywyLjczLDAsMCwxLDguMTYsOCwyLDIsMCwwLDEsOS44OSw1LjgzYTIuMDcsMi4wNywwLDAsMC0xLjUxLDJBMi4zLDIuMywwLDAsMCwxMC42OSwxMGEyLjYzLDIuNjMsMCwwLDAsMi41My0yLjc0LDMsMywwLDAsMC0zLjExLTNBMy41MywzLjUzLDAsMCwwLDYuNzIsOCw0LjMxLDQuMzEsMCwwLDAsMTEsMTIuMjZjMS45NSwwLDcuMTUtMS41Miw3LjE1LTUsMC0zLjc2LTUuODUtNi4yOS04LTYuMjktMS41MiwwLTIuODIuODctNC40OCwyLjI0VjIuMTVDNS43OC44NSw3LjQ0LjI3LDguMzguMjdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjwvZz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0yNy42NSwxNmE5Ljg2LDkuODYsMCwwLDEtMy44NS0uNjgsNy45LDcuOSwwLDAsMS0yLjY5LTEuNzhsMS43OC0yLjVBNy4xMSw3LjExLDAsMCwwLDI1LDEyLjUyYTYuMzUsNi4zNSwwLDAsMCwyLjg1LjYxLDMuMjQsMy4yNCwwLDAsMCwyLS41MiwxLjUsMS41LDAsMCwwLC42Ni0xLjE5LDEsMSwwLDAsMC0uMjYtLjcxLDIuMjcsMi4yNywwLDAsMC0uNjgtLjUsNS41Myw1LjUzLDAsMCwwLTEtLjM2bC0xLjE5LS4zMWMtLjY0LS4xNC0xLjI5LS4zMS0yLS41YTcuNDgsNy40OCwwLDAsMS0xLjg3LS44QTQuMjQsNC4yNCwwLDAsMSwyMi4xNCw2LjlhMy44NSwzLjg1LDAsMCwxLS41NS0yLjE2QTQuMTUsNC4xNSwwLDAsMSwyMiwyLjkyYTQuNiw0LjYsMCwwLDEsMS4xNi0xLjQ5QTUuMiw1LjIsMCwwLDEsMjUsLjQxLDcuNTYsNy41NiwwLDAsMSwyNy40NiwwYTguNTQsOC41NCwwLDAsMSw2LDIuMTZMMzEuNjYsNC42YTYuMTMsNi4xMywwLDAsMC0yLjE0LTEuMjksNy4xOCw3LjE4LDAsMCwwLTIuMzYtLjQsMi42NywyLjY3LDAsMCwwLTEuNjQuNDNBMS4zMiwxLjMyLDAsMCwwLDI1LDQuNDZhLjkzLjkzLDAsMCwwLC4yNC42NCwxLjg4LDEuODgsMCwwLDAsLjY3LjQ1LDYuNzEsNi43MSwwLDAsMCwxLC4zNEwyOCw2LjE4Yy42My4xNSwxLjI5LjMzLDIsLjUyYTcuMDksNy4wOSwwLDAsMSwxLjg4LjgyLDQuNDMsNC40MywwLDAsMSwxLjM5LDEuMzcsMy44MywzLjgzLDAsMCwxLC41NSwyLjE2LDUsNSwwLDAsMS0uMzksMiw0LjE1LDQuMTUsMCwwLDEtMS4xNCwxLjU2LDUuNTIsNS41MiwwLDAsMS0xLjk0LDFBOC42Miw4LjYyLDAsMCwxLDI3LjY1LDE2WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zNC45LDE1LjczVi4yN2gxMVYzLjE2SDM4LjJWNi40M2g3LjQ5djIuOUgzOC4ydjMuNWg3LjY1djIuOVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNDcuMjYsMTUuNzNWLjI3aDExVjMuMTZINTAuNTZWNi40M2g3LjQ5djIuOUg1MC41NnYzLjVoNy42NXYyLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTYzLjczLDE1LjczVjJINTguODRWLjI3SDcwLjU3VjJINjUuNjVWMTUuNzNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTg0LjA5LDE1LjczVjguNjRINzV2Ny4wOUg3My4xMlYuMjdINzVWNi45Mmg5Vi4yN0g4NlYxNS43M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNODkuNjMsMTUuNzNWLjI3SDk5Ljc3VjJIOTEuNTZWN2g4VjguNjhoLThWMTRoOC4yMXYxLjcyWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0xMTQuNjUsMTUuNzNsLTMuNC0xMi40Ny0zLjQxLDEyLjQ3aC0yLjA5TDEwMS4zNC4yN2gyLjE0bDMuNDMsMTIuODlMMTEwLjQ2LjI3aDEuNmwzLjU1LDEyLjg5TDExOSwuMjdoMi4xNGwtNC40MSwxNS40NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTIyLjIxLDhjMC00LjU2LDMuMDktOCw3LjY4LThzNy42OCwzLjQ0LDcuNjgsOC0zLjExLDgtNy42OCw4UzEyMi4yMSwxMi41OCwxMjIuMjEsOFptMTMuMzYsMGMwLTMuNjEtMi4yMy02LjI4LTUuNjgtNi4yOFMxMjQuMjEsNC40LDEyNC4yMSw4czIuMiw2LjI4LDUuNjgsNi4yOFMxMzUuNTcsMTEuNiwxMzUuNTcsOFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTQ5LjUzLDE1LjczbC0zLjk0LTYuMTRIMTQyLjV2Ni4xNGgtMS45MlYuMjdoNi4yMWE0LjUxLDQuNTEsMCwwLDEsNC44NSw0LjY2LDQuMjYsNC4yNiwwLDAsMS00LDQuNDlsNC4xNyw2LjMxWm0uMTItMTAuOEEyLjg4LDIuODgsMCwwLDAsMTQ2LjU2LDJIMTQyLjVWNy45aDQuMDZBMi45LDIuOSwwLDAsMCwxNDkuNjUsNC45M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTU0LjY4LDE1LjczVi4yN2gxLjkyVjE0aDcuMTl2MS43MloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTY2LjUsMTUuNzNWLjI3aDUuMjlBNy41Miw3LjUyLDAsMCwxLDE3OS43Miw4YzAsNC40LTMuMTMsNy43Mi03LjkzLDcuNzJaTTE3Ny43Myw4YzAtMy4zNC0yLjExLTYtNS45NC02aC0zLjM2VjE0aDMuMzZBNS42OCw1LjY4LDAsMCwwLDE3Ny43Myw4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48L3N2Zz4='
  }

  class Viewer extends AbstractComponent {
    /**
     * @private
     * @constant
     * @type {string}
     */
    static IMAGE_ANIMATION_ID = 'stw-wiv-image'

    /**
     * @private
     * @constant
     * @type {number}
     */
    static PIXELS_PER_SEC = 76

    /**
     * @private
     * @constant
     * @type {string}
     */
    static CN_FULLSCREEN = 'stw-fullscreen'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ACTION_PAUSE = 'pause'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ACTION_PLAY = 'play'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ACTION_EXPAND = 'expand'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ACTION_COLLAPSE = 'collapse'

    /**
     * @private
     * @constant
     * @type {string[]}
     */
    static TRANSPORT_ACTIONS = [
      this.ACTION_PAUSE,
      this.ACTION_PLAY
    ]

    /**
     * @private
     * @constant
     * @type {string[]}
     */
    static ACTIONS = [
      ...this.TRANSPORT_ACTIONS,
      this.ACTION_EXPAND,
      this.ACTION_COLLAPSE
    ]

    /**
     * @override
     * @param {string} imageViewerId
     * @param {string} imagesBaseUrl
     * @throws {Error} If the image base-URL is invalid
     */
    constructor (
      rootElem,
      blockName,
      imageViewerId,
      imagesBaseUrl
    ) {
      if (!Validators.nonEmptyString(imagesBaseUrl)) {
        throw new Error('The image base-URL is invalid')
      }

      super(rootElem, blockName)

      // N.B. We no longer care about what the ID looks like: at the moment it's better to leave it up to the server to
      // decide what to do
      this.imageViewerId = imageViewerId
      this.imagesBaseUrl = imagesBaseUrl
    }

    /**
     * @private
     * @returns {HTMLElement}
     */
    getImageWrapperElem () {
      return this.queryBem('image-wrapper')
    }

    /**
     * @private
     * @returns {HTMLImageElement}
     */
    getImageElem () {
      return this.getImageWrapperElem().querySelector('img')
    }

    /**
     * @private
     * @returns {Animation|null}
     */
    getImageAnimation () {
      for (const currAnimation of this.getImageWrapperElem().getAnimations()) {
        if (currAnimation.id === Viewer.IMAGE_ANIMATION_ID) {
          return currAnimation
        }
      }

      return null
    }

    /**
     * @private
     */
    clearImageAnimation () {
      const animation = this.getImageAnimation()

      if (animation) {
        animation.cancel()
      }
    }

    /**
     * @private
     * @param {Function} [onReady]
     */
    setUpAnimation (onReady) {
      this.clearImageAnimation()

      const viewerViewportWidth = this.getRootElem().clientWidth
      const imageWidth = this.getImageElem().clientWidth
      const oneWayDeltaPx = imageWidth - viewerViewportWidth

      // Put another way: *don't* bother animating if the delta is equivalent to less than 5% of the width of the image
      const imageNeedsToBeAnimated = (oneWayDeltaPx / imageWidth) >= 0.05

      if (!imageNeedsToBeAnimated) {
        this.addClassBem('', 'static')

        return
      }

      // (There and back.  See animation spec, below.)
      const durationMs = ((oneWayDeltaPx * 2) / Viewer.PIXELS_PER_SEC) * 1000

      this.getImageWrapperElem().animate(
        // (Left to right and back again)
        { transform: ['translateX(0)', `translateX(-${oneWayDeltaPx}px)`, 'translateX(0)'] },
        { id: Viewer.IMAGE_ANIMATION_ID, duration: durationMs, iterations: Infinity, easing: 'linear' }
      )

      if (onReady) {
        this
          .getImageAnimation()
          .ready
          .then(onReady)
      }
    }

    /**
     * @private
     */
    handleOrientationChanged () {
      this.setUpAnimation()
    }

    /**
     * Transport action
     *
     * @private
     */
    expand () {
      this.getRootElem().classList.add(Viewer.CN_FULLSCREEN)
      this.setUpAnimation()
    }

    /**
     * Transport action
     *
     * @private
     */
    collapse () {
      this.getRootElem().classList.remove(Viewer.CN_FULLSCREEN)
      this.setUpAnimation()
    }

    /**
     * @private
     * @param {CustomEvent} e
     * @throws {Error} The action does not exist
     */
    handleControlClicked (e) {
      const actionName = e.detail.action

      if (!Viewer.ACTIONS.includes(actionName)) {
        throw new Error(`The action, \`${actionName}\`, does not exist`)
      }

      let subject = this

      if (Viewer.TRANSPORT_ACTIONS.includes(actionName)) {
        subject = this.getImageAnimation()

        const animationIsActive = subject && ['running', 'paused'].includes(subject.playState)

        if (!animationIsActive) {
          return
        }
      }

      subject[actionName]()
    }

    /**
     * @private
     * @param {object|null} meta
     */
    processMetadata (meta) {
      if (meta && meta.alt) {
        this.getImageElem().alt = meta.alt
      }

      /** @type {ViewerOverlay} */
      const overlay = this.getComponent('overlay')
      overlay.processMetadata(meta)
    }

    /**
     * @private
     * @param {string} nameOfCallbackToProcessData
     * @returns {string}
     */
    createImageMetadataUrl (nameOfCallbackToProcessData) {
      return `${this.imagesBaseUrl}/${this.imageViewerId}/meta?callback=` + encodeURIComponent(nameOfCallbackToProcessData)
    }

    /**
     * The image has loaded.  Now we can finish setting-up the viewer.
     *
     * @private
     */
    finishSetUp () {
      const nameOfCallbackForProcessingMetadata = HtmlUtils.uniqid('stwWivAddMetaToOverlay')
      this.getWindow()[nameOfCallbackForProcessingMetadata] = this.processMetadata.bind(this)
      this.appendChild('script').setAttribute('src', this.createImageMetadataUrl(nameOfCallbackForProcessingMetadata))

      this.setUpAnimation(() => {
        /** @type {ViewerOverlay} */
        const overlay = this.getComponent('overlay')
        overlay.useControls()
        overlay.getRootElem().addEventListener('seetheworld:click-control', this.handleControlClicked.bind(this))
      })

      // Ready: Viewer
    }

    /**
     * @private
     * @returns {string}
     */
    createImageUrl () {
      const imageViewerId = this.imageViewerId

      const imagePath = imageViewerId.indexOf('://') === -1
        ? ('/' + imageViewerId)
        : '/show-offsite?url=' + encodeURIComponent(imageViewerId)

      return this.imagesBaseUrl + imagePath
    }

    /**
     * @override
     */
    setUp () {
      const imageUrl = this.createImageUrl()

      const classNames = {
        root: this.bem(),
        imageWrapper: this.bem('image-wrapper')
      }

      const googleFont = {
        family: 'Inter',
        sizes: {
          normal: 350,
          semibold: 550
        },
        createImportUrl: function () {
          const sizesStr = Object.values(this.sizes).join(';')

          return `https://fonts.googleapis.com/css2?family=${this.family}:wght@${sizesStr}&display=swap`
        }
      }

      // Includes base styles
      this.getDomHelper().addStylesheet(`
        @import url('${googleFont.createImportUrl()}');

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(.97) }
          to { opacity: 1; transform: scale(1) }
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1) }
          to { opacity: 0; transform: scale(.97) }
        }

        .${classNames.root},
        .${classNames.root} * {
          box-sizing: border-box;
        }

        .${classNames.root} {
          --fs-multiplier-down: 0.875;

          --fs-base: calc(1rem * var(--fs-multiplier-down));
          --fs-sm: calc(var(--fs-base) * var(--fs-multiplier-down));

          --fw-semibold: ${googleFont.sizes.semibold};

          --spacer-base: 1rem;
          --spacer-1: calc(var(--spacer-base) * 0.25);
          --spacer-2: calc(var(--spacer-base) * 0.5);
          --spacer-3: var(--spacer-base);

          --color-white: #fff;
          --color-gray-600: #6c757d;
          --color-gray-700: #495057;
          --color-empty: #F4F3EF;
          --color-in-page-nav: #E8E6E1;  /* In-page nav, borders */
          --color-in-page-nav-contrast: #201A1A;  /* Our usual body colour */

          --z-index-overlay: 1;

          --filter-bg-obscure: blur(7px) opacity(0.85);

          position: relative;
          width: 100%;
          aspect-ratio: 6/4;
          overflow-x: auto;
          font-family: "${googleFont.family}", sans-serif;
          font-size: var(--fs-base);
          font-weight: ${googleFont.sizes.normal};
          line-height: 1.1;
        }

        .${classNames.root}.${Viewer.CN_FULLSCREEN} {
          position: fixed;
          z-index: 9999999;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          aspect-ratio: auto;
        }

        .${classNames.root} a {
          color: currentColor;
          text-decoration: underline .2ex;
        }

        .${classNames.root} a:hover {
          text-decoration: none;
        }

        .${this.bem('', 'static')} .${classNames.imageWrapper}::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          overflow: hidden;
          background-image: url("${imageUrl}");
          background-size: cover;
          background-repeat: no-repeat;
          filter: var(--filter-bg-obscure);
        }

        .${classNames.imageWrapper},
        .${classNames.imageWrapper} img {
          height: 100%;
        }

        .${classNames.imageWrapper} {
          position: relative;
          text-align: center;
          background-color: var(--color-empty);
          background-image: url("${Images.SRC_STW_LOGO}");
          background-position: center center;
          background-repeat: no-repeat;
          background-size: 60%;
        }
      `)

      this.getRootElem().innerHTML = `
        <div class="${classNames.imageWrapper}">
          <img src="${imageUrl}" loading="lazy" alt="Webcam image">
        </div>
      `

      this.setComponent('overlay', new ViewerOverlay(this.appendChild('div'), `${classNames.root}-overlay`))

      this.getComponent('overlay').setUp()

      // See https://stackoverflow.com/a/4770179/1063649
      const wheelEventName = 'onwheel' in this.getImageWrapperElem() ? 'wheel' : 'mousewheel'
      this.getRootElem().addEventListener(wheelEventName, e => e.preventDefault())

      screen.orientation.addEventListener('change', this.handleOrientationChanged.bind(this))

      // Continue setting-up when we definitely have an image and can see what we're dealing with
      this.getImageElem().addEventListener('load', this.finishSetUp.bind(this))
    }
  }

  /**
   * @typedef {{name: string, icon: string, title?: string}} ActionDef
   *
   * @fires #seetheworld:click-control
   */
  class ViewerOverlay extends AbstractComponent {
    /**
     * @private
     * @constant
     * @type {Object.<string,ActionDef>}
     */
    static ACTION_DEFS = {
      [Viewer.ACTION_PAUSE]: {
        name: Viewer.ACTION_PAUSE,
        icon: Images.ICON_PAUSE,
        title: 'Pause'
      },
      [Viewer.ACTION_PLAY]: {
        name: Viewer.ACTION_PLAY,
        icon: Images.ICON_PLAY,
        title: 'Play'
      },
      [Viewer.ACTION_EXPAND]: {
        name: Viewer.ACTION_EXPAND,
        icon: Images.ICON_EXPAND,
        title: 'Expand'
      },
      [Viewer.ACTION_COLLAPSE]: {
        name: Viewer.ACTION_COLLAPSE,
        icon: Images.ICON_COLLAPSE,
        title: 'Collapse'
      }
    }

    /**
     * @private
     * @constant
     * @type {string}
     */
    static CN_DISABLED = 'stw-disabled'

    /**
     * @private
     * @constant
     * @type {string}
     */
    static CN_VISIBLE = 'stw-visible'

    /**
     * @override
     */
    constructor (rootElem, blockName) {
      super(rootElem, blockName)

      this.timeoutHide = undefined
    }

    /**
     * @private
     */
    getMainElem () {
      return this.queryBem('main')
    }

    /**
     * @private
     * @return {boolean}
     */
    mainElemIsEnabled () {
      return !this.getMainElem().classList.contains(ViewerOverlay.CN_DISABLED)
    }

    /**
     * @private
     * @return {boolean}
     */
    mainElemIsShown () {
      return this.getMainElem().classList.contains(ViewerOverlay.CN_VISIBLE)
    }

    /**
     * @private
     */
    showMainElem () {
      if (!this.mainElemIsEnabled()) {
        return
      }

      // Explicitly showing, so cancel any delayed hide requests
      this.getWindow().clearTimeout(this.timeoutHide)
      this.getMainElem().classList.add(ViewerOverlay.CN_VISIBLE)
    }

    /**
     * @private
     * @param {number} [delaySecs]
     */
    hideMainElem (delaySecs) {
      if (!this.mainElemIsEnabled()) {
        return
      }

      const hideElem = () => this.getMainElem().classList.remove(ViewerOverlay.CN_VISIBLE)

      if (delaySecs) {
        // (If the Main element is already due to be hidden then we needn't do anything)
        if (!this.timeoutHide) {
          this.timeoutHide = this.getWindow().setTimeout(hideElem, delaySecs * 1000)
        }

        return
      }

      // (We're hiding now, so cancel any pending action)
      this.getWindow().clearTimeout(this.timeoutHide)
      hideElem()
    }

    /**
     * @private
     * @param {string} method
     * @param {string} html
     */
    attachHtmlToMain (method, html) {
      this.getDomHelper().attachHtmlTo(method, html, this.getMainElem())
    }

    /**
     * @private
     * @param {string} actionName
     * @returns {string}
     * @throws {Error} If the action-name is invalid
     */
    createControlHtml (actionName) {
      if (!(actionName in ViewerOverlay.ACTION_DEFS)) {
        throw new Error('The action-name is invalid')
      }

      const actionDef = ViewerOverlay.ACTION_DEFS[actionName]
      const attrsStr = actionDef.title ? `title="${actionDef.title}"` : ''

      return `
        <a
          href="#"
          data-stw-action="${actionName}"
          ${attrsStr}
        >${actionDef.icon}</a>`
    }

    /**
     * @private
     * @param {PointerEvent} e
     */
    handleClicked (e) {
      const evt = new EventDecorator(e)

      const anchorTargetElem = evt.getAnchorTarget(2)

      if (anchorTargetElem) {
        const currActionName = anchorTargetElem.dataset.stwAction

        if (!currActionName) {
          return
        }

        // Viewer-control clicked:

        e.preventDefault()

        this.getRootElem().dispatchEvent(new CustomEvent('seetheworld:click-control', {
          detail: { action: currActionName }
        }))

        const nextActionName = ({
          [Viewer.ACTION_PAUSE]: Viewer.ACTION_PLAY,
          [Viewer.ACTION_PLAY]: Viewer.ACTION_PAUSE,
          [Viewer.ACTION_EXPAND]: Viewer.ACTION_COLLAPSE,
          [Viewer.ACTION_COLLAPSE]: Viewer.ACTION_EXPAND
        })[currActionName]

        if (!nextActionName) {
          return // (Nothing to do)
        }

        this.getDomHelper().attachHtmlTo('after', this.createControlHtml(nextActionName), anchorTargetElem)
        anchorTargetElem.remove()
      }
    }

    /**
     * @private
     * @param {MouseEvent} e
     */
    handleTap (e) {
      // Overlay, itself, tapped:
      if (e.target === this.getRootElem()) {
        if (this.mainElemIsShown()) {
          this.hideMainElem()
        } else {
          this.showMainElem()
        }
      }
    }

    /**
     * @private
     * @param {MouseEvent} e
     */
    handleMouseenter (e) {
      e.stopPropagation()
      this.showMainElem()
    }

    /**
     * @private
     * @param {MouseEvent} e
     */
    handleMouseleave (e) {
      e.stopPropagation()
      this.hideMainElem()
    }

    /**
     * @override
     */
    setUp () {
      const classNames = {
        main: this.bem('main'),
        article: this.bem('article'),
        articleHeader: this.bem('article-header'),
        articleMainHeading: this.bem('main-heading'),
        articleByline: this.bem('byline'),
        articleOsm: this.bem('osm'),
        articleBody: this.bem('article-body'),
        controls: this.bem('controls')
      }

      const helpers = {
        animateFadeIn: `
          animation: fadeIn ease 0.3s;
          animation-fill-mode: forwards;
        `,
        animateFadeOut: `
          animation: fadeOut ease 0.3s;
          animation-fill-mode: forwards;
        `,
        subtleLift: 'box-shadow: 0 1px 3px rgba(0, 0, 0, .3);'
      }

      this.getDomHelper().addStylesheet(`
        .${this.bem()} {
          --overlay-controls-button-size: 44px;  /* WCAG 2.5.5 AAA / WCAG 2.1 */
          --overlay-controls-button-size-lg: 48px;  /* WCAG 2.5.5 AAA / WCAG 2.1 */
          --overlay-controls-button-border-radius: 999px;
          --overlay-controls-icon-size: 26px;
          --overlay-controls-icon-size-lg: 28px;

          --overlay-main-gap: var(--spacer-3);
          --overlay-main-gap-lg: calc(var(--overlay-controls-button-size-lg) / 2);

          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-index-overlay);
          display: flex;
          justify-content: center;
          align-items: end;
          color: var(--color-white);
          background: transparent;
        }

        .${classNames.main} {
          ${helpers.animateFadeOut}
          ${helpers.subtleLift}
          pointer-events: none;
          display: flex;
          flex-direction: row-reverse;
          align-items: stretch;
          text-shadow: 1px 1px var(--color-gray-700);
          backdrop-filter: blur(25px);
          margin: var(--spacer-3);
          padding: var(--spacer-2);
          border: 1px solid var(--color-gray-600);
          border-radius: var(--overlay-controls-button-border-radius);
        }

        .${classNames.main}.${ViewerOverlay.CN_DISABLED} {
          display: none;
        }

        .${classNames.main}.${ViewerOverlay.CN_VISIBLE} {
          ${helpers.animateFadeIn}
          pointer-events: auto;
        }

        .${classNames.article} {
          display: flex;
          align-items: center;
          margin-left: var(--overlay-main-gap);
          margin-right: var(--overlay-main-gap-lg);
        }

        /* When no controls */
        .${classNames.main} > .${classNames.article}:last-child {
          margin-left: var(--overlay-main-gap-lg);
        }

        .${classNames.articleHeader} {
          flex: 1 0 auto;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* When no body */
        .${classNames.article} > .${classNames.articleHeader}:last-child {
          margin-right: var(--overlay-main-gap-lg);
        }

        .${classNames.articleMainHeading} {
          font-weight: var(--fw-semibold);
        }

        .${classNames.articleMainHeading},
        .${classNames.articleByline} {
          flex: 0 0 auto;
        }

        .${classNames.articleByline},
        .${classNames.articleOsm} {
          font-size: var(--fs-sm);
        }

        .${classNames.articleOsm} {
          flex: 1 0 auto;
          display: flex;
          align-items: end;
        }

        .${classNames.articleOsm} time {
          display: flex;
          align-items: center;
          gap: var(--spacer-1);
          white-space: nowrap;
        }

        .${classNames.articleOsm} time svg {
          height: 1em;
        }

        .${classNames.articleBody} {
          display: none;
        }

        .${classNames.controls} {
          display: flex;
          align-items: center;
          gap: var(--spacer-2)
        }

        .${classNames.controls} a {
          ${helpers.subtleLift}
          display: flex;
          justify-content: center;
          align-items: center;
          width: var(--overlay-controls-button-size);
          height: var(--overlay-controls-button-size);
          color: var(--color-in-page-nav-contrast);
          background-color: var(--color-in-page-nav);
          border-radius: var(--overlay-controls-button-border-radius);
        }

        .${classNames.controls} a svg {
          fill: currentColor;
          width: var(--overlay-controls-icon-size);
          height: var(--overlay-controls-icon-size);
        }

        .${classNames.controls} > a:first-child {
          width: var(--overlay-controls-button-size-lg);
          height: var(--overlay-controls-button-size-lg);
          color: var(--color-white);
          background-color: var(--color-in-page-nav-contrast);
        }

        .${classNames.controls} > a:first-child svg {
          width: var(--overlay-controls-icon-size-lg);
          height: var(--overlay-controls-icon-size-lg);
        }

        .${classNames.controls} > a:first-child svg.stw-icon-play {
          padding-left: 3px;
        }

        @media screen and (width >= 576px) {
          .${classNames.article} {
            margin-right: auto;
          }

          .${classNames.articleBody} {
            display: block;
            margin-left: var(--overlay-main-gap);
            margin-right: var(--overlay-main-gap-lg);
          }

          /* When alone in article */
          .${classNames.article} > .${classNames.articleBody}:first-child {
            margin-left: 0;
          }
        }
      `)

      // The bare minimum for now
      this.getRootElem().innerHTML = `<div class="${classNames.main} ${ViewerOverlay.CN_DISABLED}"></div>`

      this.getRootElem().addEventListener('mouseenter', this.handleMouseenter.bind(this))
      this.getRootElem().addEventListener('mouseleave', this.handleMouseleave.bind(this))
      this.getRootElem().addEventListener('click', this.handleClicked.bind(this))
      this.getRootElem().addEventListener('mousedown', this.handleTap.bind(this))
    }

    /**
     * @public
     * @param {object|null} meta
     */
    processMetadata (meta) {
      if (meta) {
        const tplContext = { meta }

        let headerContent = ''

        headerContent += tplContext.meta.title
          ? `<div class="${this.bem('main-heading')}">${tplContext.meta.title}</div>`
          : ''

        if (tplContext.meta.byline) {
          const bylineContent = typeof tplContext.meta.url === 'string'
            ? `<a href="${tplContext.meta.url}" target="_blank">${tplContext.meta.byline}</a>`
            : tplContext.meta.byline

          headerContent += `<div class="${this.bem('byline')}">by ${bylineContent}</div>`
        }

        if (tplContext.meta.dateCreated) {
          const createdAt = new Date(tplContext.meta.dateCreated)
          let formattedDate

          if (tplContext.meta.isOutdated) {
            const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (DateTimeUtils.SECS_PER_DAY * 1000))
            formattedDate = `${Images.ICON_NOTICE}<span>More than ${ageDays} days old</span>`
          } else {
            if (DateTimeUtils.dateIsToday(createdAt)) {
              formattedDate = `Today at ${createdAt.toLocaleTimeString()}`
            } else if (DateTimeUtils.dateIsYesterday(createdAt)) {
              formattedDate = `Yesterday at ${createdAt.toLocaleTimeString()}`
            } else {
              formattedDate = createdAt.toLocaleString()
            }
          }

          headerContent += formattedDate
            ? `<div class="${this.bem('osm')}"><time datetime="${tplContext.meta.dateCreated}">${formattedDate}</time></div>`
            : ''
        }

        const bodyContent = ''

        const headerHtml = headerContent
          ? `<div class="${this.bem('article-header')}">${headerContent}</div>`
          : ''

        const bodyHtml = bodyContent
          ? `<div class="${this.bem('article-body')}">${bodyContent}</div>`
          : ''

        if (headerHtml || bodyHtml) {
          this.attachHtmlToMain('prepend', `<div class="${this.bem('article')}">${headerHtml}${bodyHtml}</div>`)
        }
      }

      if (this.getMainElem().childElementCount) {
        this.getMainElem().classList.remove(ViewerOverlay.CN_DISABLED)
        this.showMainElem()
        this.hideMainElem(/* Hide after (seconds) */3)
      }

      // Ready: Overlay
    }

    /**
     * @public
     */
    useControls () {
      const controlsContent = this.createControlHtml(Viewer.ACTION_PAUSE) +
        this.createControlHtml(Viewer.ACTION_EXPAND)

      this.attachHtmlToMain('append', `<div class="${this.bem('controls')}">${controlsContent}</div>`)
    }
  }

  const viewerBlockName = 'stw-wiv'
  const webcamImagesBaseUrl = 'https://plum.powderblue.co.uk/images/webcams'

  document.querySelectorAll(`.${viewerBlockName}`).forEach((/** @type {HTMLElement} */viewerRootElem) => {
    const viewer = new Viewer(
      viewerRootElem,
      viewerBlockName,
      viewerRootElem.dataset.stwImageId,
      webcamImagesBaseUrl
    )

    viewer.setUp()
  })
})(document)
