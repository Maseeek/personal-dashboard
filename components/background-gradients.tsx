import React from "react";

export default function BackgroundGradients() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="drift-orange" aria-hidden="true" />
      <div className="drift-grey" aria-hidden="true" />
    </div>
  );
}
