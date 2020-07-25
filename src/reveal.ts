// Type Definitions
interface RevealOptions extends IntersectionObserverInit {
  elements: Element[]
  prepend?: Element[]
  interval?: number
}

interface RevealElement {
  parentId: string
  element: Element
}

interface Queue {
  _state: RevealElement[]
  getState: () => RevealElement[]
  add: (revealElements: RevealElement[]) => void
  remove: (parentId: string) => void
  shift: () => RevealElement | undefined
}

// Constants
const DEFAULT_OPTIONS: RevealOptions = {
  elements: [],
  prepend: [],
  interval: 100,
}

const REVEALED_SELECTOR = '[data-revealed]'
const UNREVEALED_SELECTOR = '[data-reveal]:not([data-revealed])'

// Store
const queue: Queue = {
  _state: [],
  getState: function () {
    return this._state.slice()
  },
  add: function (revealElements) {
    this._state = this.getState().concat(revealElements)
  },
  remove: function (containerId) {
    this._state = this.getState().filter(
      ({ parentId }) => parentId !== containerId
    )
  },
  shift: function () {
    const state = this.getState()
    this._state = state.slice(1)
    return state[0]
  },
}

let intervalHandler: number | undefined

// Helpers
const uniqueId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15)

const displayElement = (
  element: Element,
  visibility: 'show' | 'hide',
  instantly = false
) => {
  const updateDisplay = () => {
    if (visibility === 'show') element.setAttribute('data-revealed', '')
    else element.removeAttribute('data-revealed')
  }

  if (instantly) {
    // Save the existing `style` attribute
    const style = element.getAttribute('style')
    let isTransitionDisabled = false

    const restoreStyle = () => {
      if (isTransitionDisabled) {
        if (style) element.setAttribute('style', style)
        else element.removeAttribute('style')
      } else {
        // Try again on the next frame
        window.requestAnimationFrame(restoreStyle)
      }
    }

    // Run first to skip a frame and schedule the next one
    window.requestAnimationFrame(restoreStyle)

    window.requestAnimationFrame(() => {
      element.setAttribute('style', `${style || ''}; transition: none;`)
      isTransitionDisabled = true
      updateDisplay()
    })
  } else {
    window.requestAnimationFrame(() => updateDisplay())
  }
}

const containerToRevealElements = (container: Element): RevealElement[] => {
  const parentId = container.getAttribute('data-reveal-id') || ''

  return Array.from(container.querySelectorAll(UNREVEALED_SELECTOR))
    .map((element) => ({ parentId, element }))
    .sort((a, b) =>
      (b.element.getAttribute('data-reveal') || '') >
      (a.element.getAttribute('data-reveal') || '')
        ? -1
        : 1
    )
}

const revealNextElement = (options: RevealOptions) => {
  const revealElement = queue.shift()

  if (revealElement) {
    displayElement(revealElement.element, 'show')

    if (typeof intervalHandler === 'undefined') {
      intervalHandler = window.setInterval(
        () => revealNextElement(options),
        options.interval
      )
    }
  } else {
    window.clearInterval(intervalHandler)
    intervalHandler = undefined
  }
}

const entryScrolledFrom = (
  from: 'top' | 'bottom',
  entry: IntersectionObserverEntry
) =>
  from === 'top'
    ? entry.rootBounds?.top &&
      entry.boundingClientRect.bottom <
        entry.rootBounds?.top + entry.rootBounds.height * 0.25
    : entry.rootBounds?.bottom &&
      entry.boundingClientRect.top >
        entry.rootBounds?.bottom - entry.rootBounds.height * 0.25

const revealObserver = (options: RevealOptions) =>
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        queue.add(containerToRevealElements(entry.target))

        // Start revealing elements, if it hasn't started yet
        if (typeof intervalHandler === 'undefined') revealNextElement(options)
      }

      if (!entry.isIntersecting && entryScrolledFrom('top', entry)) {
        queue.remove(entry.target.getAttribute('data-reveal-id') || '')

        // Reveal the elements immediately
        Array.from(
          entry.target.querySelectorAll(UNREVEALED_SELECTOR)
        ).forEach((element) => displayElement(element, 'show', true))
      }
    })
  }, options)

const viewportObserver = () =>
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // While scrolling up, if the container disappears from the bottom of the viewport
      if (!entry.isIntersecting && entryScrolledFrom('bottom', entry)) {
        // Hide the elements, so they can be revealed again
        Array.from(
          entry.target.querySelectorAll(REVEALED_SELECTOR)
        ).forEach((element) => displayElement(element, 'hide', true))

        queue.remove(entry.target.getAttribute('data-reveal-id') || '')
      }

      // If the container is above the viewport
      if (!entry.isIntersecting && entryScrolledFrom('top', entry)) {
        // Immediately reveal the elements
        Array.from(
          entry.target.querySelectorAll(UNREVEALED_SELECTOR)
        ).forEach((element) => displayElement(element, 'show', true))

        queue.remove(entry.target.getAttribute('data-reveal-id') || '')
      }
    })
  })

// Entry Point
const reveal = (options: RevealOptions) => {
  const revealer = revealObserver({
    ...DEFAULT_OPTIONS,
    ...options,
  })

  const viewport = viewportObserver()

  if (options.prepend) {
    options.prepend.forEach((container) =>
      queue.add(containerToRevealElements(container))
    )

    revealNextElement(options)
  }

  options.elements.forEach((container) => {
    container.setAttribute('data-reveal-id', uniqueId())

    revealer.observe(container)
    viewport.observe(container)
  })
}

module.exports = reveal
