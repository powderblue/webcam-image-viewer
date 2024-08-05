/* global
  Element,
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

    // /**
    //  * @public
    //  * @param {*} something
    //  * @returns {boolean}
    //  */
    // static alphanumericString (something) {
    //   return this.nonEmptyString(something) && /^[a-zA-Z0-9]+$/.test(something)
    // }
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
     * @private
     * @param {string} html
     * @param {Element} destElem
     * @param {string} method
     * @returns {Element}
     */
    attachHtmlTo (html, destElem, method) {
      const templateElem = destElem.appendChild(destElem.ownerDocument.createElement('template'))
      templateElem.innerHTML = html
      destElem[method](templateElem.content)
      templateElem.remove()

      return method === 'append'
        ? destElem.lastElementChild
        : destElem.firstElementChild
    }

    /**
     * @public
     * @param {Element|string} elemOrHtml
     * @param {Element} destElem
     */
    appendTo (elemOrHtml, destElem) {
      if (elemOrHtml instanceof Element) {
        return destElem.appendChild(elemOrHtml)
      }

      return this.attachHtmlTo(elemOrHtml, destElem, 'append')
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
     * Determined through testing: (1146px * 2) / 30s
     *
     * @private
     * @type {number}
     */
    static PIXELS_PER_SEC = 76

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

    // /**
    //  * @private
    //  * @param {*} something
    //  * @returns {boolean}
    //  */
    // static validateImageBasename (something) {
    //   return Validators.nonEmptyString(something) && /^[a-zA-Z0-9]+\.[a-zA-Z]+$/.test(something)
    // }

    /**
     * @public
     * @param {HTMLElement} rootElem
     * @param {string} imageViewerId
     * @param {string} imagesBaseUrl
     */
    constructor (
      rootElem,
      imageViewerId,
      imagesBaseUrl
    ) {
      this.setRootElem(rootElem)
      this.setImageViewerId(imageViewerId)
      this.setImagesBaseUrl(imagesBaseUrl)

      const ownerDocument = this.getRootElem().ownerDocument

      this.setDomHelper(new DomHelper(ownerDocument))

      const rootZIndex = parseInt(ownerDocument.defaultView.getComputedStyle(this.getRootElem()).zIndex) || 0
      this.setBaseZIndex(rootZIndex + 1)

      this.setUp()
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

    // /**
    //  * @private
    //  * @returns {boolean}
    //  */
    // animationIsActive () {
    //   const animation = this.getImageAnimation()

    //   return animation && ['running', 'paused'].includes(animation.playState)
    // }

    /**
     * @private
     */
    handleControlsClicked () {
      // if (!this.animationIsActive()) {
      //   // (Nothing to do)
      //   return
      // }

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
    preventAllManualScrolling () {
      const wheelEventName = 'onwheel' in this.getImageWrapperElem() ? 'wheel' : 'mousewheel'
      this.getRootElem().addEventListener(wheelEventName, e => e.preventDefault())
    }

    /**
     * @private
     * @returns {number}
     */
    calculateDelta () {
      const viewerViewportWidth = this.getRootElem().clientWidth

      return this.getImageElem().clientWidth - viewerViewportWidth
    }

    /**
     * @private
     * @returns {boolean}
     */
    imageNeedsToBeAnimated () {
      // Put another way: *don't* animate if the delta is equivalent to less than 5% of the width of the image
      return (this.calculateDelta() / this.getImageElem().clientWidth) >= 0.05
    }

    /**
     * @private
     */
    setUpControls () {
      // Lock it down
      this.preventAllManualScrolling()

      this.getDomHelper().addStylesheet(`
        .${WebcamImageViewer.bem()} {
          overflow-x: auto;
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
          cursor: pointer;
        }

        .${WebcamImageViewer.bem('controls')} svg {
          height: 12%;
          min-height: 3rem;
          fill: #fff;
        }
      `)

      this.getDomHelper().appendTo(`
        <div class="${WebcamImageViewer.bem('controls')}">
          ${WebcamImageViewer.ICONS.pause}
        </div>`, this.getRootElem())

      const oneWayDeltaPx = this.calculateDelta()
      // (There and back.  See animation spec, below.)
      const totalDeltaPx = oneWayDeltaPx * 2
      const durationMs = (totalDeltaPx / WebcamImageViewer.PIXELS_PER_SEC) * 1000

      this
        .getImageWrapperElem()
        .animate(
          // (Left to right and back again)
          { transform: ['translateX(0)', `translateX(-${oneWayDeltaPx}px)`, 'translateX(0)'] },
          { id: WebcamImageViewer.IMAGE_ANIMATION_ID, duration: durationMs, iterations: Infinity, easing: 'linear' }
        )
        .ready
        .then(() => {
          const controlsFadeOptions = { duration: 100/* ms */, iterations: 1, easing: 'ease-in' }

          this.getRootElem().addEventListener('mouseenter', () => {
            // if (!this.animationIsActive()) {
            //   return
            // }

            this
              .getControlsElem()
              .animate({ opacity: ['0', this.getControlsElem().style.opacity] }, controlsFadeOptions)
              .ready
              .then(() => {
                this.getControlsElem().style.zIndex = String(this.getBaseZIndex() + 1)
              })
          })

          this.getRootElem().addEventListener('mouseleave', () => {
            // if (!this.animationIsActive()) {
            //   return
            // }

            this
              .getControlsElem()
              .animate({ opacity: [this.getControlsElem().style.opacity, 0] }, controlsFadeOptions)
              .finished
              .then(() => {
                this.getControlsElem().style.zIndex = String(this.getBaseZIndex() - 1)
              })
          })

          this.getRootElem().addEventListener('click', this.handleControlsClicked.bind(this))
        })
    }

    /**
     * @private
     */
    setUp () {
      const imagePath = this.getImageViewerId().indexOf('://') === -1
        ? `/${this.getImageViewerId()}`
        : '/show-offsite?url=' + encodeURIComponent(this.getImageViewerId())

      const imageUrl = this.getImagesBaseUrl() + imagePath
      const rootInitializing = WebcamImageViewer.bem('', 'initializing')

      this.getDomHelper().addStylesheet(`
        .${WebcamImageViewer.bem()} {
          position: relative;
          overflow: hidden;
        }

        .${rootInitializing} .${WebcamImageViewer.bem('image-wrapper')},
        .${WebcamImageViewer.bem('', 'static')} .${WebcamImageViewer.bem('image-wrapper')} {
          text-align: center;
        }

        .${WebcamImageViewer.bem('', 'static')} .${WebcamImageViewer.bem('image-wrapper')}::before {
          --blur-radius: 12px;

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
          -webkit-filter: blur(var(--blur-radius));
          -moz-filter: blur(var(--blur-radius));
          -o-filter: blur(var(--blur-radius));
          -ms-filter: blur(var(--blur-radius));
          filter: blur(var(--blur-radius)) grayscale(50%);
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
      `)

      this.getRootElem().classList.add(rootInitializing)

      this.getRootElem().innerHTML = `
        <div class="${WebcamImageViewer.bem('image-wrapper')}">
          <img src="${imageUrl}" loading="lazy">
        </div>`

      // Finish setting-up the viewer when the image has loaded -- when we can examine the image
      this.getImageElem().addEventListener('load', () => {
        if (this.imageNeedsToBeAnimated()) {
          this.setUpControls()
        } else {
          this.getRootElem().classList.add(WebcamImageViewer.bem('', 'static'))
        }

        this.getRootElem().classList.remove(rootInitializing)
      })
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
     * We no longer care about what the ID looks like: at the moment it's better to leave it up to the server to decide
     * what to do
     *
     * @private
     * @param {string} id
     * @throws {Error} If the Image Viewer ID is invalid
     */
    setImageViewerId (id) {
      // // N.B. Keep the validation as simple as is reasonable
      // const idIsAlphanumeric = Validators.alphanumericString(id)
      // const idIsABasename = WebcamImageViewer.validateImageBasename(id)
      // const idIsValid = idIsAlphanumeric || idIsABasename

      // if (!idIsValid) {
      //   throw new Error(`The Image Viewer ID, \`${id}\`, is invalid`)
      // }

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
    getImagesBaseUrl () {
      return this.imagesBaseUrl
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

  // const webcamImagesBaseUrl = 'http://images-service.dan.spongebob/images/webcams'
  const webcamImagesBaseUrl = 'https://plum.powderblue.co.uk/images/webcams'
  const selector = '.' + WebcamImageViewer.bem()

  document.querySelectorAll(selector).forEach((/** @type {HTMLElement} */viewerElem) => {
    /* eslint-disable-next-line */
    new WebcamImageViewer(
      viewerElem,
      viewerElem.dataset.stwImageId,
      webcamImagesBaseUrl
    )
  })
})(document)
