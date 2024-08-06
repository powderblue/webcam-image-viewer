/* global
  HTMLElement,
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
     * @param {string} html
     * @param {Element} destElem
     * @param {string} method
     */
    attachHtmlTo (html, destElem, method) {
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

  class Images {
    /**
     * @public
     * @constant
     * @type {string}
     */
    static ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><title>Pause</title><!--!Font Awesome Pro 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M48 96c-8.8 0-16 7.2-16 16l0 288c0 8.8 7.2 16 16 16l48 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16L48 96zM0 112C0 85.5 21.5 64 48 64l48 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-48 0c-26.5 0-48-21.5-48-48L0 112zM224 96c-8.8 0-16 7.2-16 16l0 288c0 8.8 7.2 16 16 16l48 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16l-48 0zm-48 16c0-26.5 21.5-48 48-48l48 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-48 0c-26.5 0-48-21.5-48-48l0-288z"/></svg>'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static ICON_PLAY = '<svg class="stw-icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><title>Play</title><!--!Font Awesome Pro 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M56.3 66.3c-4.9-3-11.1-3.1-16.2-.3s-8.2 8.2-8.2 14l0 352c0 5.8 3.1 11.1 8.2 14s11.2 2.7 16.2-.3l288-176c4.8-2.9 7.7-8.1 7.7-13.7s-2.9-10.7-7.7-13.7l-288-176zM24.5 38.1C39.7 29.6 58.2 30 73 39L361 215c14.3 8.7 23 24.2 23 41s-8.7 32.2-23 41L73 473c-14.8 9.1-33.4 9.4-48.5 .9S0 449.4 0 432L0 80C0 62.6 9.4 46.6 24.5 38.1z"/></svg>'

    /**
     * @public
     * @constant
     * @type {string}
     */
    static SRC_STW_LOGO = 'data:image/svg+xml;base64,PHN2ZyBpZD0iR3JleSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTc5LjcyIiBoZWlnaHQ9IjE1Ljk5IiB2aWV3Qm94PSIwIDAgMTc5LjcyIDE1Ljk5Ij48ZGVmcz48c3R5bGU+LmNscy0xLC5jbHMtMntmaWxsOiNlZDI1NTk7fS5jbHMtMXtmaWxsLXJ1bGU6ZXZlbm9kZDt9LmNscy0ze2ZpbGw6IzNiNDI0OTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPnNlZXRoZXdvcmxkLWxvZ288L3RpdGxlPjxnIGlkPSJzZWUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIxLDEzLjI3YTIuODYsMi44NiwwLDAsMS0yLjY3LDIuNDZIOC4xNmMtLjg3LS4xNS0yLjQ1LS45NC0yLjUzLTJhMTUuMDYsMTUuMDYsMCwwLDAsNS4wNiwxLjQ1YzIuNjcsMCw4LjE2LTIuMzksMTAuMzMtNC4zM1pNMTguMTMuMjdDMTkuNDMuNDIsMjEsMSwyMSwyLjUxVjguMzZjLTEuNDUsMi43NS03Ljg4LDUuMjctMTAuNCw1LjI3QzcuOCwxMy42MywyLDEwLjQ1LDAsNy44NWwxLjA4LS4yMWMuMzYtLjA4LjczLS4yOSwxLjA5LS4zNkM0LjY5LDYuNDgsOCwyLjQ0LDEwLjExLDIuNDRjMS41OSwwLDYuNTcsMi4yNCw2LjU3LDQuODRTMTIsMTAuNzQsMTEuMDUsMTAuNzRBMi43MywyLjczLDAsMCwxLDguMTYsOCwyLDIsMCwwLDEsOS44OSw1LjgzYTIuMDcsMi4wNywwLDAsMC0xLjUxLDJBMi4zLDIuMywwLDAsMCwxMC42OSwxMGEyLjYzLDIuNjMsMCwwLDAsMi41My0yLjc0LDMsMywwLDAsMC0zLjExLTNBMy41MywzLjUzLDAsMCwwLDYuNzIsOCw0LjMxLDQuMzEsMCwwLDAsMTEsMTIuMjZjMS45NSwwLDcuMTUtMS41Miw3LjE1LTUsMC0zLjc2LTUuODUtNi4yOS04LTYuMjktMS41MiwwLTIuODIuODctNC40OCwyLjI0VjIuMTVDNS43OC44NSw3LjQ0LjI3LDguMzguMjdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjwvZz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0yNy42NSwxNmE5Ljg2LDkuODYsMCwwLDEtMy44NS0uNjgsNy45LDcuOSwwLDAsMS0yLjY5LTEuNzhsMS43OC0yLjVBNy4xMSw3LjExLDAsMCwwLDI1LDEyLjUyYTYuMzUsNi4zNSwwLDAsMCwyLjg1LjYxLDMuMjQsMy4yNCwwLDAsMCwyLS41MiwxLjUsMS41LDAsMCwwLC42Ni0xLjE5LDEsMSwwLDAsMC0uMjYtLjcxLDIuMjcsMi4yNywwLDAsMC0uNjgtLjUsNS41Myw1LjUzLDAsMCwwLTEtLjM2bC0xLjE5LS4zMWMtLjY0LS4xNC0xLjI5LS4zMS0yLS41YTcuNDgsNy40OCwwLDAsMS0xLjg3LS44QTQuMjQsNC4yNCwwLDAsMSwyMi4xNCw2LjlhMy44NSwzLjg1LDAsMCwxLS41NS0yLjE2QTQuMTUsNC4xNSwwLDAsMSwyMiwyLjkyYTQuNiw0LjYsMCwwLDEsMS4xNi0xLjQ5QTUuMiw1LjIsMCwwLDEsMjUsLjQxLDcuNTYsNy41NiwwLDAsMSwyNy40NiwwYTguNTQsOC41NCwwLDAsMSw2LDIuMTZMMzEuNjYsNC42YTYuMTMsNi4xMywwLDAsMC0yLjE0LTEuMjksNy4xOCw3LjE4LDAsMCwwLTIuMzYtLjQsMi42NywyLjY3LDAsMCwwLTEuNjQuNDNBMS4zMiwxLjMyLDAsMCwwLDI1LDQuNDZhLjkzLjkzLDAsMCwwLC4yNC42NCwxLjg4LDEuODgsMCwwLDAsLjY3LjQ1LDYuNzEsNi43MSwwLDAsMCwxLC4zNEwyOCw2LjE4Yy42My4xNSwxLjI5LjMzLDIsLjUyYTcuMDksNy4wOSwwLDAsMSwxLjg4LjgyLDQuNDMsNC40MywwLDAsMSwxLjM5LDEuMzcsMy44MywzLjgzLDAsMCwxLC41NSwyLjE2LDUsNSwwLDAsMS0uMzksMiw0LjE1LDQuMTUsMCwwLDEtMS4xNCwxLjU2LDUuNTIsNS41MiwwLDAsMS0xLjk0LDFBOC42Miw4LjYyLDAsMCwxLDI3LjY1LDE2WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zNC45LDE1LjczVi4yN2gxMVYzLjE2SDM4LjJWNi40M2g3LjQ5djIuOUgzOC4ydjMuNWg3LjY1djIuOVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNDcuMjYsMTUuNzNWLjI3aDExVjMuMTZINTAuNTZWNi40M2g3LjQ5djIuOUg1MC41NnYzLjVoNy42NXYyLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTYzLjczLDE1LjczVjJINTguODRWLjI3SDcwLjU3VjJINjUuNjVWMTUuNzNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTg0LjA5LDE1LjczVjguNjRINzV2Ny4wOUg3My4xMlYuMjdINzVWNi45Mmg5Vi4yN0g4NlYxNS43M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNODkuNjMsMTUuNzNWLjI3SDk5Ljc3VjJIOTEuNTZWN2g4VjguNjhoLThWMTRoOC4yMXYxLjcyWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0xMTQuNjUsMTUuNzNsLTMuNC0xMi40Ny0zLjQxLDEyLjQ3aC0yLjA5TDEwMS4zNC4yN2gyLjE0bDMuNDMsMTIuODlMMTEwLjQ2LjI3aDEuNmwzLjU1LDEyLjg5TDExOSwuMjdoMi4xNGwtNC40MSwxNS40NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTIyLjIxLDhjMC00LjU2LDMuMDktOCw3LjY4LThzNy42OCwzLjQ0LDcuNjgsOC0zLjExLDgtNy42OCw4UzEyMi4yMSwxMi41OCwxMjIuMjEsOFptMTMuMzYsMGMwLTMuNjEtMi4yMy02LjI4LTUuNjgtNi4yOFMxMjQuMjEsNC40LDEyNC4yMSw4czIuMiw2LjI4LDUuNjgsNi4yOFMxMzUuNTcsMTEuNiwxMzUuNTcsOFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTQ5LjUzLDE1LjczbC0zLjk0LTYuMTRIMTQyLjV2Ni4xNGgtMS45MlYuMjdoNi4yMWE0LjUxLDQuNTEsMCwwLDEsNC44NSw0LjY2LDQuMjYsNC4yNiwwLDAsMS00LDQuNDlsNC4xNyw2LjMxWm0uMTItMTAuOEEyLjg4LDIuODgsMCwwLDAsMTQ2LjU2LDJIMTQyLjVWNy45aDQuMDZBMi45LDIuOSwwLDAsMCwxNDkuNjUsNC45M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTU0LjY4LDE1LjczVi4yN2gxLjkyVjE0aDcuMTl2MS43MloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTY2LjUsMTUuNzNWLjI3aDUuMjlBNy41Miw3LjUyLDAsMCwxLDE3OS43Miw4YzAsNC40LTMuMTMsNy43Mi03LjkzLDcuNzJaTTE3Ny43Myw4YzAtMy4zNC0yLjExLTYtNS45NC02aC0zLjM2VjE0aDMuMzZBNS42OCw1LjY4LDAsMCwwLDE3Ny43Myw4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48L3N2Zz4='
  }

  /**
   * @fires #seetheworld:click-control
   */
  class ViewerOverlay extends AbstractComponent {
    /**
     * @private
     * @constant
     * @type {string}
     */
    static ACTION_PAUSE = 'pause'

    /**
     * @private
     * @constant
     * @type {string}
     */
    static ACTION_PLAY = 'play'

    /**
     * @private
     * @constant
     * @type {object}
     */
    static ACTION_ICONS = {
      [this.ACTION_PAUSE]: Images.ICON_PAUSE,
      [this.ACTION_PLAY]: Images.ICON_PLAY
    }

    /**
     * @private
     * @param {string} actionName
     * @returns {string}
     * @throws {Error} If the action-name is invalid
     */
    createControlHtml (actionName) {
      if (!(actionName in ViewerOverlay.ACTION_ICONS)) {
        throw new Error('The action-name is invalid')
      }

      return `<a href="#" data-stw-action="${actionName}">${ViewerOverlay.ACTION_ICONS[actionName]}</a>`
    }

    /**
     * @private
     * @param {PointerEvent} e
     */
    handleControlClicked (e) {
      const evt = new EventDecorator(e)
      const targetElem = evt.getAnchorTarget(2)

      if (!targetElem) {
        // (No anchor target)
        return
      }

      e.preventDefault()

      // #########> Toggle #########

      const currActionName = targetElem.dataset.stwAction

      this.getRootElem().dispatchEvent(new CustomEvent('seetheworld:click-control', {
        detail: { action: currActionName }
      }))

      const nextActionName = currActionName === ViewerOverlay.ACTION_PAUSE
        ? ViewerOverlay.ACTION_PLAY
        : ViewerOverlay.ACTION_PAUSE

      this.getDomHelper().attachHtmlTo(this.createControlHtml(nextActionName), targetElem, 'after')
      targetElem.remove()

      // #########< Toggle #########
    }

    /**
     * @override
     */
    setUp () {
      const names = {
        root: this.bem(),
        title: this.bem('title'),
        byline: this.bem('byline'),
        dateCreated: this.bem('date-created'),
        controls: this.bem('controls')
      }

      this.getDomHelper().addStylesheet(`
        .${names.root} {
          --overlay-padding: var(--spacer-3);
          --overlay-color-body: var(--color-white);
          --overlay-color-body-bg: var(--color-black-semi);

          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: +1;
          color: var(--overlay-color-body);
          background: transparent;
          padding: var(--overlay-padding);
        }

        /* ######> Main Header ###### */

        .${names.root} > header {
          display: none;
          justify-content: space-between;
          align-items: start;
        }

        .${this.bem('', 'has-meta')} > header {
          display: flex;
          animation: fadeIn ease 2s;
          animation-fill-mode: forwards;
        }

        /* With a background */
        .${names.title},
        .${names.byline},
        .${names.dateCreated} > time,
        .${names.controls} a {
          background-color: var(--overlay-color-body-bg);
          backdrop-filter: var(--filter-bg-obscure);
          box-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        /* Text content, inline */
        .${names.title},
        .${names.byline},
        .${names.dateCreated} > time {
          padding: 0 var(--spacer-1);
        }

        /* Text content, inline */
        .${names.title},
        .${names.byline} {
          display: inline-block;  /* Tightens-up vertical whitespace */
        }

        .${names.byline},
        .${names.dateCreated} > time {
          font-size: var(--fs-sm);
          font-weight: var(--font-weight-lighter);
        }

        .${names.title} {
          font-size: var(--fs-5);
          font-weight: var(--font-weight-semibold);
        }

        /* Interactive elements */
        a.${names.byline},
        .${names.controls} a {
          background-color: var(--color-accent-semi);
        }

        /* ######< Main Header ###### */

        /* ######> Controls ###### */

        .${names.controls} {
          position: absolute;
          bottom: var(--overlay-padding);
          width: 100%;
          display: none;
          justify-content: center;
          align-items: center;
        }

        .${this.bem('', 'has-controls')} .${names.controls} {
          display: flex;
          animation: fadeIn ease 2s;
          animation-fill-mode: forwards;
        }

        .${names.controls} a {
          display: block;
          line-height: 1;
          width: var(--fs-1);
          height: var(--fs-1);
          text-align: center;
          padding: var(--spacer-2);
          border: 0;
          border-radius: 50%;
        }

        .${names.controls} a svg {
          height: 100%;
          fill: var(--color-white);
        }

        /* ######< Controls ###### */
      `)

      // Just the framework for now
      this.getRootElem().innerHTML = `
        <header></header>
        <div class="${names.controls}"></div>
      `
    }

    /**
     * @public
     * @param {object|null} meta
     */
    addMetadata (meta) {
      if (!meta) {
        // (For now, do nothing)
        return
      }

      const tplContext = { meta }

      const bylineHtml = typeof tplContext.meta.url === 'string'
        ? `<a href="${tplContext.meta.url}" target="_blank" class="${this.bem('byline')}">${tplContext.meta.byLine}</a>`
        : `<span>${tplContext.meta.byLine}</span>`

      this.getRootElem().querySelector('header').innerHTML = `
        <div class="${this.bem('heading')}">
          <span class="${this.bem('title')}">${tplContext.meta.title}</span>
          <br>
          ${bylineHtml}
        </div>

        <div class="${this.bem('date-created')}"><time>${tplContext.meta.dateCreated}</time></div>
      `

      // "Loaded", effectively
      this.addClassBem('', 'has-meta')
    }

    /**
     * @public
     */
    useControls () {
      const controlsElem = this.queryBem('controls')
      controlsElem.innerHTML = this.createControlHtml(ViewerOverlay.ACTION_PAUSE)
      controlsElem.addEventListener('click', this.handleControlClicked.bind(this))

      // "Loaded", effectively
      this.addClassBem('', 'has-controls')
    }
  }

  class Viewer extends AbstractComponent {
    /**
     * The ID of the image animation, the 'main' animation
     *
     * @private
     * @type {string}
     */
    static IMAGE_ANIMATION_ID = 'stw-wiv-image'

    /**
     * Determined through testing: (1146px * 2) / 30s
     *
     * @private
     * @type {number}
     */
    static PIXELS_PER_SEC = 76

    /**
     * @override
     * @param {string} imageViewerId
     * @param {string} imagesBaseUrl
     */
    constructor (
      rootElem,
      blockName,
      imageViewerId,
      imagesBaseUrl
    ) {
      super(rootElem, blockName)

      this.setImageViewerId(imageViewerId)
      this.setImagesBaseUrl(imagesBaseUrl)
    }

    /**
     * @private
     * @returns {Animation}
     * @throws {Error} If the image animation is missing
     */
    getImageAnimation () {
      const animations = this.getImageWrapperElem().getAnimations()
      const numAnimations = animations.length
      let currAnimation

      for (let i = 0; i < numAnimations; i++) {
        currAnimation = animations[i]

        if (currAnimation.id === Viewer.IMAGE_ANIMATION_ID) {
          return currAnimation
        }
      }

      throw new Error('The image animation is missing')
    }

    /**
     * @private
     * @returns {number}
     */
    calculateOneWayDelta () {
      const viewerViewportWidth = this.getRootElem().clientWidth

      return this.getImageElem().clientWidth - viewerViewportWidth
    }

    /**
     * @private
     * @param {CustomEvent} e
     */
    handleOverlayClicked (e) {
      const animation = this.getImageAnimation()
      const animationIsActive = animation && ['running', 'paused'].includes(animation.playState)

      if (!animationIsActive) {
        return
      }

      switch (e.detail.action) {
        case ViewerOverlay.ACTION_PAUSE:
          this.getImageAnimation().pause()
          break

        case ViewerOverlay.ACTION_PLAY:
          this.getImageAnimation().play()
          break
      }
    }

    /**
     * @private
     */
    setUpAnimation () {
      // Lock it down
      // See https://stackoverflow.com/a/4770179/1063649
      const wheelEventName = 'onwheel' in this.getImageWrapperElem() ? 'wheel' : 'mousewheel'
      this.getRootElem().addEventListener(wheelEventName, e => e.preventDefault())

      this.getDomHelper().addStylesheet(`
        .${this.bem()} {
          overflow-x: auto;
        }
      `)

      const oneWayDeltaPx = this.calculateOneWayDelta()
      // (There and back.  See animation spec, below.)
      const durationMs = ((oneWayDeltaPx * 2) / Viewer.PIXELS_PER_SEC) * 1000

      this
        .getImageWrapperElem()
        .animate(
          // (Left to right and back again)
          { transform: ['translateX(0)', `translateX(-${oneWayDeltaPx}px)`, 'translateX(0)'] },
          { id: Viewer.IMAGE_ANIMATION_ID, duration: durationMs, iterations: Infinity, easing: 'linear' }
        )
        .ready
        .then(() => {
          // *Now* we're ready to use the controls

          /** @type {ViewerOverlay} */
          const overlay = this.getComponent('overlay')
          overlay.useControls()
          overlay.getRootElem().addEventListener('seetheworld:click-control', this.handleOverlayClicked.bind(this))
        })
    }

    /**
     * The image has loaded.  Now we can get on and finish setting-up the viewer.
     *
     * @private
     */
    continueSetUp () {
      // #########> Fetch and process metadata #########

      /** @type {ViewerOverlay} */
      const overlay = this.getComponent('overlay')

      const nameOfCallbackForProcessingMetadata = HtmlUtils.uniqid('stwWivAddMetaToOverlay')
      this.getWindow()[nameOfCallbackForProcessingMetadata] = overlay.addMetadata.bind(overlay)

      this.appendChild('script').setAttribute('src', this.createImageMetadataUrl(nameOfCallbackForProcessingMetadata))

      // #########< Fetch and process metadata #########

      // Put another way: *don't* bother animating if the delta is equivalent to less than 5% of the width of the image
      const imageNeedsToBeAnimated = (this.calculateOneWayDelta() / this.getImageElem().clientWidth) >= 0.05

      if (imageNeedsToBeAnimated) {
        this.setUpAnimation()
      } else {
        // "Loaded", effectively
        this.addClassBem('', 'static')
      }
    }

    /**
     * @override
     */
    setUp () {
      const imageUrl = this.createImageUrl()

      const names = {
        root: this.bem(),
        imageWrapper: this.bem('image-wrapper')
      }

      // Includes base styles
      this.getDomHelper().addStylesheet(`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;600&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Annoyingly, this particular icon is off-set slightly.  The following rule corrects that. */
        .stw-icon-play {
          position: relative;
          left: 2px;
        }

        .${names.root},
        .${names.root} * {
          box-sizing: border-box;
        }

        .${names.root} {
          --line-height-base: 1.5;

          --small-coef: 0.875;
          --fs-base: calc(1rem * var(--small-coef));
          --fs-5: calc(var(--fs-base) * 1.25);
          --fs-1: calc(var(--fs-base) * 2.5);
          --fs-sm: calc(var(--fs-base) * var(--small-coef));

          --font-weight-lighter: 200;
          --font-weight-semibold: 600;

          --spacer-base: 1rem;
          --spacer-1: calc(var(--spacer-base) * 0.25);
          --spacer-2: calc(var(--spacer-base) * 0.5);
          --spacer-3: var(--spacer-base);

          --color-white: #fff;
          --color-black-semi: rgba(0,0,0,0.5);
          --color-gray-light: #e2e2e5;
          --color-accent-semi: rgba(225,35,84,0.9);  /* #e12354 */

          --filter-bg-obscure: blur(7px) opacity(0.85);

          position: relative;
          overflow: hidden;

          /* Defaults: */
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-size: var(--fs-base);
          font-weight: var(--font-weight-lighter);
          font-style: normal;
          line-height: var(--line-height-base);
        }

        .${names.root} a {
          color: inherit;
          text-decoration: underline;
        }

        .${names.root} a:hover {
          text-decoration: none;
        }

        .${this.bem('', 'static')} .${names.imageWrapper}::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          background-image: url("${imageUrl}");
          background-size: cover;
          background-repeat: no-repeat;
          filter: var(--filter-bg-obscure);
        }

        .${names.imageWrapper},
        .${names.imageWrapper} img {
          height: 100%;
        }

        .${names.imageWrapper} {
          position: relative;
          z-index: +1;
          text-align: center;
          background-color: var(--color-gray-light);
          background-image: url("${Images.SRC_STW_LOGO}");
          background-position: center center;
          background-repeat: no-repeat;
          background-size: 60%;
        }
      `)

      this.getRootElem().innerHTML = `
        <div class="${names.imageWrapper}">
          <img src="${imageUrl}" loading="lazy">
        </div>
      `

      this.setComponent('overlay', new ViewerOverlay(this.appendChild('div'), `${names.root}-overlay`))

      this.getComponent('overlay').setUp()

      // Continue setting-up when we definitely have an image and can see what we're dealing with
      this.getImageElem().addEventListener('load', this.continueSetUp.bind(this))
    }

    /**
     * N.B. We no longer care about what the ID looks like: at the moment it's better to leave it up to the server to
     * decide what to do
     *
     * @private
     * @param {string} id
     */
    setImageViewerId (id) {
      this.imageViewerId = id
    }

    /**
     * @private
     * @param {string} url
     * @throws {Error} If the image base-URL is invalid
     */
    setImagesBaseUrl (url) {
      if (!Validators.nonEmptyString(url)) {
        throw new Error('The image base-URL is invalid')
      }

      this.imagesBaseUrl = url
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
     * @private
     * @param {string} nameOfCallbackToProcessData
     * @returns {string}
     */
    createImageMetadataUrl (nameOfCallbackToProcessData) {
      return `${this.imagesBaseUrl}/${this.imageViewerId}/meta?callback=` + encodeURIComponent(nameOfCallbackToProcessData)
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
  }

  const viewerBlockName = 'stw-wiv'
  // const webcamImagesBaseUrl = 'http://images-service.dan.spongebob/images/webcams'
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
