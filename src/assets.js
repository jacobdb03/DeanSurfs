import trackRightSrc from "./assets/trackRight.png";
import trackDownSrc from "./assets/trackDown.png";
import trackLeftSrc from "./assets/trackLeft.png";
import trackUpSrc from "./assets/trackUp.png";

import corner0Src from "./assets/corner0.png";
import corner90Src from "./assets/corner90.png";
import corner180Src from "./assets/corner180.png";
import corner270Src from "./assets/corner270.png";

import cartSrc from "./assets/cart.png";

const loadImg = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });

export const loadAssets = async () => {
  const [
    trackRight,
    trackDown,
    trackLeft,
    trackUp,
    corner0,
    corner90,
    corner180,
    corner270,
    cart,
  ] = await Promise.all([
    loadImg(trackRightSrc),
    loadImg(trackDownSrc),
    loadImg(trackLeftSrc),
    loadImg(trackUpSrc),
    loadImg(corner0Src),
    loadImg(corner90Src),
    loadImg(corner180Src),
    loadImg(corner270Src),
    loadImg(cartSrc),
  ]);
  return {
    trackRight,
    trackDown,
    trackLeft,
    trackUp,
    corner0,
    corner90,
    corner180,
    corner270,
    cart,
  };
};
