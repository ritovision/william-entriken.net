module.exports = {
  standard: [
    /^animate__/, // Animate.css classes
    /^fade-/,
    /^is-/,
    'show',
    'hide',
    'active',
    'visible'
  ],
  deep: [
    /^swiper-/
  ],
  greedy: [
    /data-aos/,
    /aria-/
  ]
};
