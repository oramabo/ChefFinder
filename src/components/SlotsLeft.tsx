import Badge from "./Badge.tsx";

export default function SlotsLeft({ slots }: { slots: number }) {
  if (slots <= 0) return <Badge tone="danger">נמכר</Badge>;
  if (slots === 1) return <Badge tone="accent">מקום אחרון</Badge>;
  return <Badge tone="success">{slots} מקומות פנויים</Badge>;
}
