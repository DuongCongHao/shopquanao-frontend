const CART_TARGET_ID = "site-cart-target";
const FLY_MS = 720;

export function flyToCart(sourceEl, imageUrl) {
  const cart = document.getElementById(CART_TARGET_ID);
  if (!sourceEl || !cart || typeof sourceEl.getBoundingClientRect !== "function") {
    return Promise.resolve();
  }

  const from = sourceEl.getBoundingClientRect();
  const to = cart.getBoundingClientRect();
  if (from.width < 8 || from.height < 8) return Promise.resolve();

  const flyer = document.createElement("img");
  flyer.className = "cart-flyer";
  flyer.alt = "";
  flyer.src = imageUrl || sourceEl.currentSrc || sourceEl.src || "";

  const startX = from.left;
  const startY = from.top;
  flyer.style.cssText = [
    `left:${startX}px`,
    `top:${startY}px`,
    `width:${from.width}px`,
    `height:${from.height}px`,
  ].join(";");

  document.body.appendChild(flyer);

  if (typeof flyer.animate !== "function") {
    flyer.remove();
    return Promise.resolve();
  }

  const endX = to.left + to.width / 2 - from.width / 2;
  const endY = to.top + to.height / 2 - from.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const arc = Math.max(-140, Math.min(-56, dy * 0.35 - 90));

  const motion = flyer.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${dx * 0.42}px, ${dy * 0.22 + arc}px) scale(0.55) rotate(-12deg)`,
        opacity: 0.95,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(18deg)`,
        opacity: 0.35,
      },
    ],
    {
      duration: FLY_MS,
      easing: "cubic-bezier(0.22, 0.82, 0.28, 1)",
      fill: "forwards",
    }
  );

  const bumpCart = () => {
    cart.classList.remove("site-cart--bump");
    void cart.offsetWidth;
    cart.classList.add("site-cart--bump");
    window.setTimeout(() => cart.classList.remove("site-cart--bump"), 450);
  };

  return motion.finished
    .then(bumpCart)
    .catch(() => {})
    .finally(() => flyer.remove());
}
