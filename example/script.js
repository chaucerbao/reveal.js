import reveal from '../src/reveal'

const containers = document.querySelectorAll('[data-reveal-container]')

reveal({
  elements: Array.from(containers),
  prepend: [document.getElementById('header')],
  delay: 750,
  rootMargin: '-15% 0%',
  fastForward: true
})
