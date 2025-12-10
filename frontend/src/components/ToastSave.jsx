import React from "react";
import { Check } from "lucide-react";

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    className="text-current"
  >
    <g
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <circle cx="9" cy="9" r="7.25"></circle>
      <line x1="9" y1="12.819" x2="9" y2="8.25"></line>
      <path
        d="M9,6.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
        fill="currentColor"
        data-stroke="none"
        stroke="none"
      ></path>
    </g>
  </svg>
);

const Spinner = ({ size = "sm", className = "" }) => {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClass} ${className}`}></div>
  );
};

export function ToastSave({
  state = "initial",
  onReset,
  onSave,
  loadingText = "Saving",
  successText = "Changes Saved",
  initialText = "Unsaved changes",
  resetText = "Reset",
  saveText = "Save",
  className = "",
  ...props
}) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-white backdrop-blur border border-gray-200 shadow-lg transition-all duration-300 ${className}`}
      {...props}
    >
      <div className="flex h-full items-center justify-between px-3">
        <div className="flex items-center gap-2 text-gray-700">
          {state === "loading" && (
            <>
              <Spinner size="sm" />
              <div className="text-[13px] font-normal leading-tight whitespace-nowrap">
                {loadingText}
              </div>
            </>
          )}
          {state === "success" && (
            <>
              <div className="p-0.5 bg-emerald-500/10 rounded-full shadow-sm border border-emerald-500/20 justify-center items-center gap-1.5 flex overflow-hidden">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-[13px] font-normal leading-tight whitespace-nowrap">
                {successText}
              </div>
            </>
          )}
          {state === "initial" && (
            <>
              <div className="text-gray-600">
                <InfoIcon />
              </div>
              <div className="text-[13px] font-normal leading-tight whitespace-nowrap">
                {initialText}
              </div>
            </>
          )}
        </div>
        {state === "initial" && (
          <div className="ml-2 flex items-center gap-2">
            <button
              onClick={onReset}
              className="h-7 px-3 py-0 rounded-full text-[13px] font-normal hover:bg-gray-100 transition-colors"
            >
              {resetText}
            </button>
            <button
              onClick={onSave}
              className="h-7 px-3 py-0 rounded-full text-[13px] font-medium text-white bg-gradient-to-b from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 shadow-sm transition-all duration-200"
            >
              {saveText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToastSave;