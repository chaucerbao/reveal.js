# Reveal.js

Reveal elements one at a time as the user scrolls through your site.

*Note: This library uses [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), so a polyfill may be required for some browsers.*

## Usage
Say you have some content you want to reveal when that section enters into the viewport. Add `data-reveal` to elements you want to include. In this example, `data-reveal-container` is the element that will be watched; when it crosses into the viewport, the `data-reveal` elements will be revealed one at a time.
```html
<!-- HTML -->
<section data-reveal-container>
  <h1 data-reveal>Amazing title</h1>
  <p data-reveal>Very intriguing content.</p>
  <button data-reveal>Do the thing</button>
</section>
```

Add your containers to `reveal()` with customizable options.
```javascript
/* JavaScript */
const containers = document.querySelectorAll('[data-reveal-container]')

reveal({
  elements: Array.from(containers),
  delay: 750,            // Wait 750ms before revealing the next `data-reveal` element in the container
  rootMargin: '-15% 0%', // Activate when the container is within 15% (of the viewport height)
  fastForward: true      // Instantly reveal `data-reveal` elements above the viewport
})
```

Now, style your reveal with CSS.
```css
/* CSS */

/* Initial, hidden state */
[data-reveal] {
  transform: translateY(20%);
  opacity: 0;

  transition: opacity 1s, transform 1s;
}

/* Final, revealed state */
[data-reveal='revealed'] {
  transform: translateY(0);
  opacity: 1;
}
```

## Options
Available options for `reveal(options)`.

Option      | Type               | Default      | Description
----------- | ------------------ | ------------ | -----------
elements    | Element[]          | **Required** | An array of container elements that will be observed
delay       | number             | 100          | Time in milliseconds between each reveal
rootMargin  | string             | '0'          | Offset applied to the viewport for calculating an intersection ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#Creating_an_intersection_observer))
threshold   | number or number[] | 0            | Ratio of intersection area to the viewport ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#Creating_an_intersection_observer))
fastForward | boolean            | false        | If true, elements above the viewport are instantly revealed
