// Dependencies
import debounce from 'lodash/debounce'

// Type Definitions
interface IOptions {
  elements: Element[]
  delay: number
  rootMargin: string
  threshold: number | number[]
  fastForward: boolean
}

// Default Options
const defaultOptions = {
  elements: [],
  delay: 100,
  rootMargin: '0',
  threshold: 0,
  fastForward: false
}

let revealQueue: Element[] = []
let intervalHandler: NodeJS.Timeout | null

// Sort reveal elements inside a container
const getRevealElementPriority = (element: Element) =>
  Number(element.getAttribute('data-reveal')) || Number.MAX_SAFE_INTEGER

const sortAscending = (elementA: Element, elementB: Element) => {
  const a = getRevealElementPriority(elementA)
  const b = getRevealElementPriority(elementB)

  if (a < b) return -1
  if (a > b) return 1

  return 0
}

// Create an Intersection Observer, applying the options
const createObserver = (options: IOptions) =>
  new IntersectionObserver(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        const element = entry.target

        // If the container element is within the threshold
        if (entry.intersectionRatio > 0) {
          observer.unobserve(element)

          // Add reveal elements to the queue
          const elements = Array.from(
            element.querySelectorAll('[data-reveal]')
          ).sort(sortAscending)

          revealQueue.push(...elements)
          revealQueuedElements(options)
        }
      })
    },
    { rootMargin: options.rootMargin, threshold: options.threshold }
  )

const revealNextElement = (_options: IOptions) => {
  const element = revealQueue.shift()

  if (element) {
    element.setAttribute('data-reveal', 'revealed')
  }
}

const revealQueuedElements = (options: IOptions) => {
  if (!intervalHandler) {
    // Immediately reveal the next element
    revealNextElement(options)

    // Schedule remaining elements to be revealed
    intervalHandler = setInterval(() => {
      revealNextElement(options)

      if (intervalHandler && revealQueue.length === 0) {
        clearInterval(intervalHandler)
        intervalHandler = null
      }
    }, options.delay)
  }
}

const revealAboveViewport = (
  options: IOptions,
  observer: IntersectionObserver
) => {
  const instantRevealQueue: Element[] = []

  options.elements.forEach(element => {
    const elementRect = element.getBoundingClientRect()

    // If the element is above the viewport, add it to the queue
    if (elementRect.top + elementRect.height < 0) {
      observer.unobserve(element)

      instantRevealQueue.push(
        ...Array.from(
          element.querySelectorAll(
            '[data-reveal]:not([data-reveal="revealed"])'
          )
        )
      )
    }
  })

  // Instantly reveal queued elements
  instantRevealQueue.forEach(element => {
    element.setAttribute('style', 'transition: none')
    element.setAttribute('data-reveal', 'revealed')
    setTimeout(() => element.removeAttribute('style'), (1 / 60) * 1000)
  })

  // Remove revealed elements from the normal queue
  revealQueue = revealQueue.filter(
    element => instantRevealQueue.indexOf(element) === -1
  )
}

const reveal = (userOptions: IOptions) => {
  const options = Object.assign({}, defaultOptions, userOptions)
  const revealObserver = createObserver(options)

  options.elements.forEach(element => revealObserver.observe(element))

  if (options.fastForward) {
    window.addEventListener(
      'scroll',
      debounce(() => revealAboveViewport(options, revealObserver), 100)
    )
  }
}

window.reveal = reveal
