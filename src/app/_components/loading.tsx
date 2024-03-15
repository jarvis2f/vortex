"use client";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center">
        <video width="360" height="360" autoPlay loop muted>
          <source
            src="/3d-casual-life-screwdriver-and-wrench-as-settings.webm"
            type="video/webm"
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
