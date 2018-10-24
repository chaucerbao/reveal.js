import reveal from '../src/reveal'

reveal({
  elements: Array.from(document.querySelectorAll('[data-reveal-container]')),
  delay: 750,
  rootMargin: '-15% 0%',
  fastForward: true
})
