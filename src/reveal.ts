// Type Definitions
interface IOptions {
  elements: Element[]
  prepend?: Element[]
  delay?: number
  rootMargin?: string
  threshold?: number | number[]
  fastForward?: boolean
  onReveal?: (element: Element) => void
}

// Default Options
const defaultOptions = {
  elements: [],
  prepend: [],
  delay: 100,
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
  fastForward: false,
  onReveal: () => undefined
}

const queue: Element[] = []
let intervalHandler: number | null

const reveal = (userOptions: IOptions) => {
  const options = Object.assign({}, defaultOptions, userOptions)

  options.prepend.forEach(element => addToQueue(element))

  const observer = createObserver(options)

  options.elements.forEach(element => observer.observe(element))

  if (options.fastForward) {
    window.addEventListener('scroll', debounce(() => fastForward(options), 50))
  }

  setTimeout(() => processQueue(options), 0)
}

const createObserver = (options: IOptions) =>
  new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        // If the entry is within the threshold
        if (entry.intersectionRatio > 0) {
          observer.unobserve(entry.target)
          addToQueue(entry.target)
          processQueue(options)
        }
      })
    },
    { rootMargin: options.rootMargin, threshold: options.threshold }
  )

const addToQueue = (element: Element) =>
  queue.push.apply(
    queue,
    Array.from(
      element.querySelectorAll('[data-reveal]:not([data-reveal="revealed"])')
    ).sort(sortAscending)
  )

const processQueue = (options: IOptions) => {
  if (!intervalHandler) {
    // Reveal the first element in the queue
    if (queue.length > 0) {
      revealElement(queue.shift()!, options)
    }

    // Reveal the remaining elements on an interval
    intervalHandler = window.setInterval(() => {
      if (queue.length > 0) {
        revealElement(queue.shift()!, options)
      }

      if (queue.length === 0 && intervalHandler) {
        clearInterval(intervalHandler)
        intervalHandler = null
      }
    }, options.delay)
  }
}

const revealElement = (
  element: Element,
  options: IOptions,
  isInstant = false
) => {
  if (isInstant) {
    element.setAttribute('style', 'transition: none')
    window.setTimeout(() => element.removeAttribute('style'), (1 / 60) * 1000)
  }

  element.setAttribute('data-reveal', 'revealed')

  if (typeof options.onReveal === 'function') {
    options.onReveal(element)
  }
}

const fastForward = (options: IOptions) => {
  // Find elements above the viewport
  const elements = Array.from(
    document.querySelectorAll('[data-reveal]:not([data-reveal="revealed"])')
  ).filter(element => {
    const elementRect = element.getBoundingClientRect()

    return elementRect.top + elementRect.height < 0
  })

  if (elements.length > 0) {
    // Display them instantly
    elements.forEach(element => revealElement(element, options, true))

    // Remove them from the queue
    for (let i = elements.length - 1; i >= 0; i--) {
      const queueIndex = queue.indexOf(elements[i])

      if (queueIndex > -1) {
        queue.splice(queueIndex, 1)
      }
    }
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

const debounce = (callback: () => void, delay: number) => {
  let timeoutHandler: number | null

  return function(this: any) {
    const context = this
    const params = arguments
    const runCallback = function() {
      callback.apply(context, params)
      timeoutHandler = null
    }

    if (timeoutHandler) {
      clearTimeout(timeoutHandler)
    }

    timeoutHandler = window.setTimeout(runCallback, delay)
  }
}

// Export
export default reveal
