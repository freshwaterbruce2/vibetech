
import React from "react";
import { LucideProps } from "lucide-react";

const Paintbrush = (props: LucideProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18.37 2.63 14 7l-1.5-1.5 4.37-4.37a1.5 1.5 0 1 1 2.12 2.12Z" />
      <path d="M9 11.24a1 1 0 0 1 1.45-.04l.93.94a1 1 0 0 1-.04 1.45 1.5 1.5 0 0 1-2.12.01L9 13.4a1.5 1.5 0 0 1 0-2.16Z" />
      <path d="m14 7 3 3" />
      <path d="M8.88 13.37 7.37 14.88a5 5 0 0 1-7.07 0 5 5 0 0 1 0-7.07l1.51-1.51" />
      <path d="M4.83 10.46 10.46 4.83" />
    </svg>
  );
};

export default Paintbrush;
