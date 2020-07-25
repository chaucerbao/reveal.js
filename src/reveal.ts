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

interface State {
  queue: RevealElement[]
  intervalHandler?: number
}

interface ActionWithPayload<T> {
  type: string
  payload: T
}

interface ActionWithoutPayload {
  type: string
}

interface AddToQueueAction extends ActionWithPayload<RevealElement[]> {
  type: 'ADD_TO_QUEUE'
}

interface RemoveFromQueueAction extends ActionWithPayload<string> {
  type: 'REMOVE_FROM_QUEUE'
}

interface UnshiftQueue extends ActionWithoutPayload {
  type: 'UNSHIFT_QUEUE'
}

interface SetIntervalHandlerAction extends ActionWithPayload<number> {
  type: 'SET_INTERVAL_HANDLER'
}

interface ClearIntervalHandlerAction extends ActionWithoutPayload {
  type: 'CLEAR_INTERVAL_HANDLER'
}

type Action =
  | AddToQueueAction
  | RemoveFromQueueAction
  | UnshiftQueue
  | SetIntervalHandlerAction
  | ClearIntervalHandlerAction

interface Store {
  _state: State
  getState: () => State
  reducer: (state: State, action: Action) => State
  dispatch: (action: Action) => void
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
const store: Store = {
  _state: {
    queue: [],
  },

  getState: function () {
    return { ...this._state }
  },

  reducer: function (state, action) {
    switch (action.type) {
      case 'ADD_TO_QUEUE':
        return { ...state, queue: state.queue.concat(action.payload) }

      case 'REMOVE_FROM_QUEUE':
        return {
          ...state,
          queue: state.queue.filter(
            ({ parentId }) => parentId !== action.payload
          ),
        }

      case 'UNSHIFT_QUEUE':
        return { ...state, queue: state.queue.slice(1) }

      case 'SET_INTERVAL_HANDLER':
        return { ...state, intervalHandler: action.payload }

      case 'CLEAR_INTERVAL_HANDLER':
        return { ...state, intervalHandler: undefined }

      default:
        return state
    }
  },

  dispatch: function (action) {
    this._state = this.reducer(this.getState(), action)
  },
}

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
      element.setAttribute('style', `${style}; transition: none;`)
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
  const { queue, intervalHandler } = store.getState()
  const [revealElement] = queue

  if (revealElement) {
    store.dispatch({ type: 'UNSHIFT_QUEUE' })
    displayElement(revealElement.element, 'show')

    if (typeof intervalHandler === 'undefined') {
      store.dispatch({
        type: 'SET_INTERVAL_HANDLER',
        payload: window.setInterval(
          () => revealNextElement(options),
          options.interval
        ),
      })
    }
  } else {
    window.clearInterval(intervalHandler)
    store.dispatch({ type: 'CLEAR_INTERVAL_HANDLER' })
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
        store.dispatch({
          type: 'ADD_TO_QUEUE',
          payload: containerToRevealElements(entry.target),
        })

        // Start revealing elements, if it hasn't started yet
        if (typeof store.getState().intervalHandler === 'undefined')
          revealNextElement(options)
      }

      if (!entry.isIntersecting && entryScrolledFrom('top', entry)) {
        store.dispatch({
          type: 'REMOVE_FROM_QUEUE',
          payload: entry.target.getAttribute('data-reveal-id') || '',
        })

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

        store.dispatch({
          type: 'REMOVE_FROM_QUEUE',
          payload: entry.target.getAttribute('data-reveal-id') || '',
        })
      }

      // If the container is above the viewport
      if (!entry.isIntersecting && entryScrolledFrom('top', entry)) {
        // Immediately reveal the elements
        Array.from(
          entry.target.querySelectorAll(UNREVEALED_SELECTOR)
        ).forEach((element) => displayElement(element, 'show', true))

        store.dispatch({
          type: 'REMOVE_FROM_QUEUE',
          payload: entry.target.getAttribute('data-reveal-id') || '',
        })
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
      store.dispatch({
        type: 'ADD_TO_QUEUE',
        payload: containerToRevealElements(container),
      })
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
