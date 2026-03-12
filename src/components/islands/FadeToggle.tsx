import { useState } from "react";

type FadeToggleProps = {
  initialVisible?: boolean;
  className?: string;
};

export default function FadeToggle({
  initialVisible = true,
  className = "",
}: FadeToggleProps) {
  const [visible, setVisible] = useState(initialVisible);

  return (
    <div className={className}>
      <button
        type="button"
        className="btn btn-brand-navy"
        onClick={() => setVisible((prev) => !prev)}
      >
        Toggle
      </button>
      <div className={visible ? "fade-in" : "fade-out"}>
        {visible ? "Visible" : "Hidden"}
      </div>
    </div>
  );
}
