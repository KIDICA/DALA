import anime from "animejs";

/**
 * This module does JavaScript based animations is specifically for cases where animate.css can't be used,
 * because i.e. somewhere the overflow property is used and prevents CSS animations.
 */
export default {
  /**
   * @param {String} selector
   */
  pulse(selector) {
    anime({
      targets: selector,
      scale: 1.2,
      duration: 150,
      autoplay: true,
      easing: "easeOutBack",
      complete: () => {
        anime({
          easing: "easeOutCirc",
          targets: selector,
          scale: 1.0,
          duration: 180,
          autoplay: true,
        });
      },
    });
  },
  /**
   * @param {String|HTMLElement|ChildNode} selector
   * @param {} [options]
   * @param {String} [options.direction]
   * @param {Number} [options.duration]
   */
  slideOut(selector, options = {direction: "left"}) {
    anime({
      targets: selector,
      translateX: window.innerWidth * (options.direction == "left" ? -1 : 1),
      duration: options.duration || 150,
      autoplay: true,
      easing: "easeOutBack",
    });
  },
};