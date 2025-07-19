import { useEffect, useState } from "react";

const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      setScreenWidth(Math.min(innerWidth, innerHeight));
    };

    window.addEventListener("resize", handleResize);
    
    // Set initial screen width
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screenWidth;
};

export default useScreenWidth;