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

    /**
     * @public
     * @param {*} something
     * @returns {boolean}
     */
    static alphanumericString (something) {
      return this.nonEmptyString(something) && /^[a-zA-Z0-9]+$/.test(something)
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
  }

  class WebcamImageViewer {
    /**
     * The ID of the image animation, the 'main' animation
     *
     * @private
     * @type {string}
     */
    static IMAGE_ANIMATION_ID = 'stw-wiv-image'

    /**
     * (Values determined through testing)
     *
     * @private
     * @type {number}
     */
    static PIXELS_PER_SEC = (1146 * 2) / 30

    /**
     * @private
     * @type {object}
     */
    static ICONS = {
      pause: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Pro 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M48 96c-8.8 0-16 7.2-16 16l0 288c0 8.8 7.2 16 16 16l48 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16L48 96zM0 112C0 85.5 21.5 64 48 64l48 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-48 0c-26.5 0-48-21.5-48-48L0 112zM224 96c-8.8 0-16 7.2-16 16l0 288c0 8.8 7.2 16 16 16l48 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16l-48 0zm-48 16c0-26.5 21.5-48 48-48l48 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-48 0c-26.5 0-48-21.5-48-48l0-288z"/></svg>',
      play: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Pro 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M56.3 66.3c-4.9-3-11.1-3.1-16.2-.3s-8.2 8.2-8.2 14l0 352c0 5.8 3.1 11.1 8.2 14s11.2 2.7 16.2-.3l288-176c4.8-2.9 7.7-8.1 7.7-13.7s-2.9-10.7-7.7-13.7l-288-176zM24.5 38.1C39.7 29.6 58.2 30 73 39L361 215c14.3 8.7 23 24.2 23 41s-8.7 32.2-23 41L73 473c-14.8 9.1-33.4 9.4-48.5 .9S0 449.4 0 432L0 80C0 62.6 9.4 46.6 24.5 38.1z"/></svg>'
    }

    /**
     * @public
     * @param  {...string} args
     * @returns {string}
     */
    static bem (...args) {
      const argsCopy = args.slice()
      argsCopy.unshift('stw-wiv')

      return HtmlUtils.bem(...argsCopy)
    }

    /**
     * @public
     * @param {HTMLElement} rootElem
     * @param {string} imageViewerId
     * @param {string} imageBaseUrl
     */
    constructor (
      rootElem,
      imageViewerId,
      imageBaseUrl
    ) {
      this.setRootElem(rootElem)
      this.setImageViewerId(imageViewerId)
      this.setImageBaseUrl(imageBaseUrl)

      const ownerDocument = this.getRootElem().ownerDocument

      this.setDomHelper(new DomHelper(ownerDocument))

      const rootZIndex = parseInt(ownerDocument.defaultView.getComputedStyle(this.getRootElem()).zIndex) || 0
      this.setBaseZIndex(rootZIndex + 1)

      this.setUp()
    }

    /**
     * @private
     * @returns {Animation}
     */
    animateImage () {
      const viewerViewportWidth = this.getRootElem().clientWidth
      const deltaPx = this.getImageElem().clientWidth - viewerViewportWidth
      const durationMs = ((deltaPx * 2) / WebcamImageViewer.PIXELS_PER_SEC) * 1000

      return this.getImageWrapperElem().animate(
        // (Left to right and then back again)
        { transform: ['translateX(0)', `translateX(-${deltaPx}px)`, 'translateX(0)'] },
        { id: WebcamImageViewer.IMAGE_ANIMATION_ID, duration: durationMs, iterations: Infinity, easing: 'linear' }
      )
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

        if (currAnimation.id === WebcamImageViewer.IMAGE_ANIMATION_ID) {
          return currAnimation
        }
      }

      throw new Error('The image animation is missing')
    }

    /**
     * @private
     * @returns {boolean}
     */
    animationIsActive () {
      const animation = this.getImageAnimation()

      return animation && ['running', 'paused'].includes(animation.playState)
    }

    /**
     * @private
     */
    handleClicked () {
      if (!this.animationIsActive()) {
        // (Nothing to do)
        return
      }

      const animation = this.getImageAnimation()

      if (animation.playState === 'running') {
        animation.pause()
        this.getControlsElem().innerHTML = WebcamImageViewer.ICONS.play
      } else {
        animation.play()
        this.getControlsElem().innerHTML = WebcamImageViewer.ICONS.pause
      }
    }

    /**
     * See https://stackoverflow.com/a/4770179/1063649
     *
     * @private
     */
    preventManualScrolling () {
      const wheelEventName = 'onwheel' in this.getImageWrapperElem() ? 'wheel' : 'mousewheel'
      this.getImageWrapperElem().addEventListener(wheelEventName, e => e.preventDefault())
    }

    /**
     * @private
     */
    handleImageLoaded () {
      this
        .animateImage()
        .ready
        // The following routine applies only if we're animating; otherwise, the user can scroll
        .then(() => {
          this.preventManualScrolling()

          const fadeOptions = { duration: 100/* ms */, iterations: 1, easing: 'ease-in' }

          this.getRootElem().addEventListener('mouseenter', () => {
            if (!this.animationIsActive()) {
              return
            }

            this
              .getControlsElem()
              .animate({ opacity: ['0', this.getControlsElem().style.opacity] }, fadeOptions)
              .ready
              .then(() => {
                this.getControlsElem().style.zIndex = String(this.getBaseZIndex() + 1)
              })
          })

          this.getRootElem().addEventListener('mouseleave', () => {
            if (!this.animationIsActive()) {
              return
            }

            this
              .getControlsElem()
              .animate({ opacity: [this.getControlsElem().style.opacity, 0] }, fadeOptions)
              .finished
              .then(() => {
                this.getControlsElem().style.zIndex = String(this.getBaseZIndex() - 1)
              })
          })

          this.getRootElem().addEventListener('click', this.handleClicked.bind(this))
        })
    }

    /**
     * @private
     */
    setUp () {
      this.getDomHelper().addStylesheet(`
        .${WebcamImageViewer.bem()} {
          position: relative;
          overflow-x: auto;
          overflow-y: hidden;
          cursor: pointer;
        }

        .${WebcamImageViewer.bem('image-wrapper')},
        .${WebcamImageViewer.bem('image-wrapper')} img {
          height: 100%;
        }

        .${WebcamImageViewer.bem('image-wrapper')} {
          position: relative;
          z-index: ${this.getBaseZIndex()};
          background-color: #e2e2e5;  /* STW "light gray" */
          background-image: url("data:image/svg+xml;base64,PHN2ZyBpZD0iR3JleSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTc5LjcyIiBoZWlnaHQ9IjE1Ljk5IiB2aWV3Qm94PSIwIDAgMTc5LjcyIDE1Ljk5Ij48ZGVmcz48c3R5bGU+LmNscy0xLC5jbHMtMntmaWxsOiNlZDI1NTk7fS5jbHMtMXtmaWxsLXJ1bGU6ZXZlbm9kZDt9LmNscy0ze2ZpbGw6IzNiNDI0OTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPnNlZXRoZXdvcmxkLWxvZ288L3RpdGxlPjxnIGlkPSJzZWUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIxLDEzLjI3YTIuODYsMi44NiwwLDAsMS0yLjY3LDIuNDZIOC4xNmMtLjg3LS4xNS0yLjQ1LS45NC0yLjUzLTJhMTUuMDYsMTUuMDYsMCwwLDAsNS4wNiwxLjQ1YzIuNjcsMCw4LjE2LTIuMzksMTAuMzMtNC4zM1pNMTguMTMuMjdDMTkuNDMuNDIsMjEsMSwyMSwyLjUxVjguMzZjLTEuNDUsMi43NS03Ljg4LDUuMjctMTAuNCw1LjI3QzcuOCwxMy42MywyLDEwLjQ1LDAsNy44NWwxLjA4LS4yMWMuMzYtLjA4LjczLS4yOSwxLjA5LS4zNkM0LjY5LDYuNDgsOCwyLjQ0LDEwLjExLDIuNDRjMS41OSwwLDYuNTcsMi4yNCw2LjU3LDQuODRTMTIsMTAuNzQsMTEuMDUsMTAuNzRBMi43MywyLjczLDAsMCwxLDguMTYsOCwyLDIsMCwwLDEsOS44OSw1LjgzYTIuMDcsMi4wNywwLDAsMC0xLjUxLDJBMi4zLDIuMywwLDAsMCwxMC42OSwxMGEyLjYzLDIuNjMsMCwwLDAsMi41My0yLjc0LDMsMywwLDAsMC0zLjExLTNBMy41MywzLjUzLDAsMCwwLDYuNzIsOCw0LjMxLDQuMzEsMCwwLDAsMTEsMTIuMjZjMS45NSwwLDcuMTUtMS41Miw3LjE1LTUsMC0zLjc2LTUuODUtNi4yOS04LTYuMjktMS41MiwwLTIuODIuODctNC40OCwyLjI0VjIuMTVDNS43OC44NSw3LjQ0LjI3LDguMzguMjdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjwvZz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0yNy42NSwxNmE5Ljg2LDkuODYsMCwwLDEtMy44NS0uNjgsNy45LDcuOSwwLDAsMS0yLjY5LTEuNzhsMS43OC0yLjVBNy4xMSw3LjExLDAsMCwwLDI1LDEyLjUyYTYuMzUsNi4zNSwwLDAsMCwyLjg1LjYxLDMuMjQsMy4yNCwwLDAsMCwyLS41MiwxLjUsMS41LDAsMCwwLC42Ni0xLjE5LDEsMSwwLDAsMC0uMjYtLjcxLDIuMjcsMi4yNywwLDAsMC0uNjgtLjUsNS41Myw1LjUzLDAsMCwwLTEtLjM2bC0xLjE5LS4zMWMtLjY0LS4xNC0xLjI5LS4zMS0yLS41YTcuNDgsNy40OCwwLDAsMS0xLjg3LS44QTQuMjQsNC4yNCwwLDAsMSwyMi4xNCw2LjlhMy44NSwzLjg1LDAsMCwxLS41NS0yLjE2QTQuMTUsNC4xNSwwLDAsMSwyMiwyLjkyYTQuNiw0LjYsMCwwLDEsMS4xNi0xLjQ5QTUuMiw1LjIsMCwwLDEsMjUsLjQxLDcuNTYsNy41NiwwLDAsMSwyNy40NiwwYTguNTQsOC41NCwwLDAsMSw2LDIuMTZMMzEuNjYsNC42YTYuMTMsNi4xMywwLDAsMC0yLjE0LTEuMjksNy4xOCw3LjE4LDAsMCwwLTIuMzYtLjQsMi42NywyLjY3LDAsMCwwLTEuNjQuNDNBMS4zMiwxLjMyLDAsMCwwLDI1LDQuNDZhLjkzLjkzLDAsMCwwLC4yNC42NCwxLjg4LDEuODgsMCwwLDAsLjY3LjQ1LDYuNzEsNi43MSwwLDAsMCwxLC4zNEwyOCw2LjE4Yy42My4xNSwxLjI5LjMzLDIsLjUyYTcuMDksNy4wOSwwLDAsMSwxLjg4LjgyLDQuNDMsNC40MywwLDAsMSwxLjM5LDEuMzcsMy44MywzLjgzLDAsMCwxLC41NSwyLjE2LDUsNSwwLDAsMS0uMzksMiw0LjE1LDQuMTUsMCwwLDEtMS4xNCwxLjU2LDUuNTIsNS41MiwwLDAsMS0xLjk0LDFBOC42Miw4LjYyLDAsMCwxLDI3LjY1LDE2WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zNC45LDE1LjczVi4yN2gxMVYzLjE2SDM4LjJWNi40M2g3LjQ5djIuOUgzOC4ydjMuNWg3LjY1djIuOVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNDcuMjYsMTUuNzNWLjI3aDExVjMuMTZINTAuNTZWNi40M2g3LjQ5djIuOUg1MC41NnYzLjVoNy42NXYyLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTYzLjczLDE1LjczVjJINTguODRWLjI3SDcwLjU3VjJINjUuNjVWMTUuNzNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0wLjAxKSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTg0LjA5LDE1LjczVjguNjRINzV2Ny4wOUg3My4xMlYuMjdINzVWNi45Mmg5Vi4yN0g4NlYxNS43M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNODkuNjMsMTUuNzNWLjI3SDk5Ljc3VjJIOTEuNTZWN2g4VjguNjhoLThWMTRoOC4yMXYxLjcyWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0xMTQuNjUsMTUuNzNsLTMuNC0xMi40Ny0zLjQxLDEyLjQ3aC0yLjA5TDEwMS4zNC4yN2gyLjE0bDMuNDMsMTIuODlMMTEwLjQ2LjI3aDEuNmwzLjU1LDEyLjg5TDExOSwuMjdoMi4xNGwtNC40MSwxNS40NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTIyLjIxLDhjMC00LjU2LDMuMDktOCw3LjY4LThzNy42OCwzLjQ0LDcuNjgsOC0zLjExLDgtNy42OCw4UzEyMi4yMSwxMi41OCwxMjIuMjEsOFptMTMuMzYsMGMwLTMuNjEtMi4yMy02LjI4LTUuNjgtNi4yOFMxMjQuMjEsNC40LDEyNC4yMSw4czIuMiw2LjI4LDUuNjgsNi4yOFMxMzUuNTcsMTEuNiwxMzUuNTcsOFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTQ5LjUzLDE1LjczbC0zLjk0LTYuMTRIMTQyLjV2Ni4xNGgtMS45MlYuMjdoNi4yMWE0LjUxLDQuNTEsMCwwLDEsNC44NSw0LjY2LDQuMjYsNC4yNiwwLDAsMS00LDQuNDlsNC4xNyw2LjMxWm0uMTItMTAuOEEyLjg4LDIuODgsMCwwLDAsMTQ2LjU2LDJIMTQyLjVWNy45aDQuMDZBMi45LDIuOSwwLDAsMCwxNDkuNjUsNC45M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTU0LjY4LDE1LjczVi4yN2gxLjkyVjE0aDcuMTl2MS43MloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuMDEpIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTY2LjUsMTUuNzNWLjI3aDUuMjlBNy41Miw3LjUyLDAsMCwxLDE3OS43Miw4YzAsNC40LTMuMTMsNy43Mi03LjkzLDcuNzJaTTE3Ny43Myw4YzAtMy4zNC0yLjExLTYtNS45NC02aC0zLjM2VjE0aDMuMzZBNS42OCw1LjY4LDAsMCwwLDE3Ny43Myw4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMC4wMSkiLz48L3N2Zz4=");
          background-position: center center;
          background-repeat: no-repeat;
          background-size: 60%;
        }

        .${WebcamImageViewer.bem('controls')} {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: ${this.getBaseZIndex() - 1};  /* Initially out of view */
          opacity: 0.4;  /* (Target opacity) */
          background-color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .${WebcamImageViewer.bem('controls')} svg {
          height: 20%;
          fill: #fff;
        }
      `)

      this.getRootElem().innerHTML = `
        <div class="${WebcamImageViewer.bem('controls')}">
          ${WebcamImageViewer.ICONS.pause}
        </div>

        <div class="${WebcamImageViewer.bem('image-wrapper')}">
          <img src="${this.getImageBaseUrl()}/images/webcams/${this.getImageViewerId()}" loading="lazy">
        </div>
      `

      // Finish setting-up the viewer when the image has loaded
      this.getImageElem().addEventListener('load', this.handleImageLoaded.bind(this))
    }

    /**
     * @private
     * @param {HTMLElement} elem
     */
    setRootElem (elem) {
      this.rootElem = elem
    }

    /**
     * @private
     * @returns {HTMLElement}
     */
    getRootElem () {
      return this.rootElem
    }

    /**
     * @private
     * @param {number} value
     */
    setBaseZIndex (value) {
      this.baseZIndex = value
    }

    /**
     * @private
     * @returns {number}
     */
    getBaseZIndex () {
      return this.baseZIndex
    }

    /**
     * @private
     * @param {string} id
     * @throws {Error} If the Image Viewer ID is invalid
     */
    setImageViewerId (id) {
      // N.B. Don't do anything more clever than this!
      if (!Validators.alphanumericString(id)) {
        throw new Error(`The Image Viewer ID, \`${id}\`, is invalid`)
      }

      this.imageViewerId = id
    }

    /**
     * @private
     * @returns {string}
     */
    getImageViewerId () {
      return this.imageViewerId
    }

    /**
     * @private
     * @param {string} url
     * @throws {Error} If the image base-URL is invalid
     */
    setImageBaseUrl (url) {
      if (!Validators.nonEmptyString(url)) {
        throw new Error('The image base-URL is invalid')
      }

      this.imageBaseUrl = url
    }

    /**
     * @private
     * @returns {string}
     */
    getImageBaseUrl () {
      return this.imageBaseUrl
    }

    /**
     * @private
     * @param {DomHelper} domHelper
     */
    setDomHelper (domHelper) {
      this.domHelper = domHelper
    }

    /**
     * @private
     * @returns {DomHelper}
     */
    getDomHelper () {
      return this.domHelper
    }

    /**
     * @private
     * @param  {...string} args
     * @returns {HTMLElement|null}
     */
    queryBem (...args) {
      return this.getRootElem().querySelector('.' + WebcamImageViewer.bem(...args))
    }

    /**
     * @private
     * @returns {HTMLElement}
     */
    getControlsElem () {
      return this.queryBem('controls')
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

  const webcamImageBaseUrl = 'https://plum.powderblue.co.uk'
  const selector = '.' + WebcamImageViewer.bem()

  document.querySelectorAll(selector).forEach((/** @type {HTMLElement} */viewerElem) => {
    /* eslint-disable-next-line */
    new WebcamImageViewer(
      viewerElem,
      viewerElem.dataset.stwIvId,
      webcamImageBaseUrl
    )
  })
})(document)
