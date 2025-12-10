import React, { useState } from "react";

const animationStates = [
  {
    bgColor: "#fc7359",
    indicatorColor: "#790b02",
    pathColor: "#fc7359",
    smileColor: "#790b02",
    titleColor: "#790b02",
    trackColor: "#fc5b3e",
    eyeWidth: 56,
    eyeHeight: 56,
    eyeBorderRadius: "100%",
    eyeBg: "#790b02",
    smileRotate: 180,
    indicatorRotate: 180,
    noteText: "BAD",
    noteColor: "#e33719",
    noteX: "0%",
    indicatorLeft: "0%",
  },
  {
    bgColor: "#dfa342",
    indicatorColor: "#482103",
    pathColor: "#dfa342",
    smileColor: "#482103",
    titleColor: "#482103",
    trackColor: "#b07615",
    eyeWidth: 100,
    eyeHeight: 20,
    eyeBorderRadius: "36px",
    eyeBg: "#482103",
    smileRotate: 180,
    indicatorRotate: 180,
    noteText: "NOT BAD",
    noteColor: "#b37716",
    noteX: "-100%",
    indicatorLeft: "50%",
  },
  {
    bgColor: "#9fbe59",
    indicatorColor: "#0b2b03",
    pathColor: "#9fbe59",
    smileColor: "#0b2b03",
    titleColor: "#0b2b03",
    trackColor: "#698b1b",
    eyeWidth: 120,
    eyeHeight: 120,
    eyeBorderRadius: "100%",
    eyeBg: "#0b2b03",
    smileRotate: 0,
    indicatorRotate: 0,
    noteText: "GOOD",
    noteColor: "#6e901d",
    noteX: "-200%",
    indicatorLeft: "100%",
  },
];

const HandDrawnSmileIcon = ({ style, ...props }) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 100 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transition: "stroke 0.5s ease",
      ...style
    }}
    {...props}
  >
    <path
      d="M10 30 Q50 70 90 30"
      strokeWidth="12"
      strokeLinecap="round"
      stroke={style?.stroke || "#000"}
    />
  </svg>
);

const FeedbackSlider = ({ className, ...props }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentAnim = animationStates[selectedIndex];

  const eyeStyle = {
    width: `${currentAnim.eyeWidth}px`,
    height: `${currentAnim.eyeHeight}px`,
    borderRadius: currentAnim.eyeBorderRadius,
    backgroundColor: currentAnim.eyeBg,
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  const containerStyle = {
    backgroundColor: currentAnim.bgColor,
    transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  const titleStyle = {
    color: currentAnim.titleColor,
    transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  const smileContainerStyle = {
    transform: `rotate(${currentAnim.smileRotate}deg)`,
    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  const noteContainerStyle = {
    transform: `translateX(${currentAnim.noteX})`,
    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  const indicatorStyle = {
    left: currentAnim.indicatorLeft,
    transform: `translateX(-50%) rotate(${currentAnim.indicatorRotate}deg)`,
    backgroundColor: currentAnim.indicatorColor,
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  const trackStyle = {
    backgroundColor: currentAnim.trackColor,
    transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  return (
    <div
      className={`relative flex h-screen w-full items-center justify-center overflow-hidden ${className || ''}`}
      style={containerStyle}
      {...props}
    >
      <div className="flex h-full w-[400px] flex-col items-center justify-center p-4">
        <h3
          className="mb-10 w-72 text-center text-xl font-semibold"
          style={titleStyle}
        >
          How was your banking experience?
        </h3>
        
        <div className="flex h-[176px] flex-col items-center justify-center">
          {/* Eyes */}
          <div className="flex items-center justify-center gap-8">
            <div style={eyeStyle} />
            <div style={eyeStyle} />
          </div>
          
          {/* Smile */}
          <div
            className="flex h-14 w-14 items-center justify-center"
            style={smileContainerStyle}
          >
            <HandDrawnSmileIcon style={{ stroke: currentAnim.smileColor }} />
          </div>
        </div>
        
        {/* Rating Text */}
        <div className="flex w-full items-center justify-start overflow-hidden pb-14 pt-7">
          <div
            className="flex w-full shrink-0"
            style={noteContainerStyle}
          >
            {animationStates.map((state, i) => (
              <div
                key={i}
                className="flex w-full shrink-0 items-center justify-center"
              >
                <h1
                  className="text-7xl font-black"
                  style={{ color: state.noteColor }}
                >
                  {state.noteText}
                </h1>
              </div>
            ))}
          </div>
        </div>
        
        {/* Rating Controls */}
        <div className="w-full">
          <div className="relative flex w-full items-center justify-between">
            {/* Track dots */}
            {animationStates.map((_, i) => (
              <button
                key={i}
                className="z-[2] h-6 w-6 rounded-full hover:scale-110 transition-transform"
                onClick={() => setSelectedIndex(i)}
                style={{ backgroundColor: currentAnim.trackColor }}
              />
            ))}
            
            {/* Track line */}
            <div
              className="absolute top-1/2 h-1 w-full -translate-y-1/2"
              style={trackStyle}
            />
            
            {/* Indicator */}
            <div
              className="absolute z-[3] flex h-10 w-10 items-center justify-center rounded-full p-2"
              style={indicatorStyle}
            >
              <HandDrawnSmileIcon style={{ stroke: currentAnim.pathColor }} />
            </div>
          </div>
          
          {/* Labels */}
          <div className="flex w-full items-center justify-between pt-6">
            {["Bad", "Not Bad", "Good"].map((text, i) => (
              <span
                key={text}
                className="w-full text-center font-medium transition-all duration-500"
                style={{
                  color: currentAnim.titleColor,
                  opacity: selectedIndex === i ? 1 : 0.6,
                }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSlider;