import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    if (location.pathname.startsWith("/management")) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.key, location.pathname]);

  return null;
};

export default ScrollToTop;
