// Dependencies
import debounce from 'lodash/debounce'
import pullAll from 'lodash/pullAll'

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

const queue: Element[] = []
let intervalHandler: NodeJS.Timeout | null

const reveal = (userOptions: IOptions) => {
  const options = Object.assign({}, defaultOptions, userOptions)
  const observer = createObserver(options)

  options.elements.forEach(element => observer.observe(element))

  if (options.fastForward) {
    window.addEventListener('scroll', debounce(() => fastForward(), 50))
  }
}

const createObserver = (options: IOptions) =>
  new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        // If the entry is within the threshold
        if (entry.intersectionRatio > 0) {
          observer.unobserve(entry.target)

          const elements = entry.target.querySelectorAll(
            '[data-reveal]:not([data-reveal="revealed"])'
          )

          queue.push.apply(queue, Array.from(elements).sort(sortAscending))

          processQueue(options)
        }
      })
    },
    { rootMargin: options.rootMargin, threshold: options.threshold }
  )

const processQueue = (options: IOptions) => {
  if (!intervalHandler) {
    // Reveal the first element in the queue
    if (queue.length > 0) {
      revealElement(queue.shift()!)
    }

    // Reveal the remaining elements on an interval
    intervalHandler = setInterval(() => {
      if (queue.length > 0) {
        revealElement(queue.shift()!)
      }

      if (queue.length === 0 && intervalHandler) {
        clearInterval(intervalHandler)
        intervalHandler = null
      }
    }, options.delay)
  }
}

const revealElement = (element: Element, isInstant = false) => {
  if (isInstant) {
    element.setAttribute('style', 'transition: none')
    setTimeout(() => element.removeAttribute('style'), (1 / 60) * 1000)
  }

  element.setAttribute('data-reveal', 'revealed')
}

const fastForward = () => {
  // Find elements above the viewport
  const elements = Array.from(
    document.querySelectorAll('[data-reveal]:not([data-reveal="revealed"])')
  ).filter(element => {
    const elementRect = element.getBoundingClientRect()

    return elementRect.top + elementRect.height < 0
  })

  if (elements.length > 0) {
    // Display them instantly
    elements.forEach(element => revealElement(element, true))

    // Remove them from the queue
    pullAll(queue, elements)
  }
}

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

// Export
window.reveal = reveal
