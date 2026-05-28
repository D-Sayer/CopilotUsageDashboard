import { Share2 } from "lucide-react";

interface Props {
  onClick: () => void;
}

export function ShareButton({ onClick }: Props) {
  return (
    <button type="button" className="share-button" onClick={onClick}>
      <Share2 size={16} />
      Share
    </button>
  );
}
