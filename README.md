# Reveal.js &middot; ![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/@chaucerbao/reveal.js.svg)

Reveal elements one at a time while the user scrolls through your site.

_Note: This library uses [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), so a polyfill may be required for some browsers._

## Usage

Add the `data-reveal` attribute to individual elements you want animated as the user scrolls. Group those elements into a container. When the container crosses a certain threshold the `data-reveal` elements inside will be revealed, one at a time.

```html
<!-- HTML -->
<section class="container">
  <h1 data-reveal>Amazing title</h1>
  <p data-reveal>Very intriguing content.</p>
  <button data-reveal>Do the thing</button>
</section>
```

Initialize `reveal()` with customizable options.

```javascript
/* JavaScript */
reveal({
  elements: document.querySelectorAll('.container'),
  prepend: document.querySelectorAll('header'), // Prepended elements animate on-load
  interval: 750, // Elements will be revealed on a 750ms interval
  rootMargin: '-15% 0%', // Begin revealing when a container is 15% into the viewport
})
```

Now, define your reveal animation with CSS.

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

| Option     | Type      | Default           | Description                                                                                                                                                                          |
| ---------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| elements   | Element[] | **Required**      | An array of container elements that will be observed                                                                                                                                 |
| prepend    | Element[] | []                | An array of container elements that will be revealed immediately after initialization                                                                                                |
| interval   | number    | 100               | Interval (in milliseconds) between each reveal                                                                                                                                             |
| rootMargin | string    | '0px 0px 0px 0px' | Offset applied to the viewport for calculating an intersection ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#Creating_an_intersection_observer)) |
