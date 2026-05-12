"use client";

import NextNProgress from "nextjs-progressbar";

export default function ProgressBar() {
  return (
    <NextNProgress
      color="#15803d"
      startPosition={0.3}
      stopDelayMs={200}
      height={3}
      showOnShallow={true}
      options={{ showSpinner: false }}
    />
  );
}
