import { useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, ImagePlus, X } from "lucide-react";
import type { ShareCardData } from "../share";
import { buildShareCardSvg, createShareCardPreviewUrl, renderShareCardPng } from "../share";

interface Props {
  onClose: () => void;
  data: ShareCardData;
}

type BusyAction = "download" | "copy-image" | "copy-caption" | null;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ShareCardModal({ onClose, data }: Props) {
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [status, setStatus] = useState<string | null>(null);
  const svg = useMemo(() => buildShareCardSvg(data), [data]);
  const previewUrl = useMemo(() => createShareCardPreviewUrl(svg), [svg]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleDownload = async () => {
    setBusyAction("download");
    setStatus(null);

    try {
      const blob = await renderShareCardPng(svg);
      downloadBlob(blob, `copilot-usage-${new Date().toISOString().slice(0, 10)}.png`);
      setStatus("PNG downloaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't download the image.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyImage = async () => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setStatus("Clipboard image copy isn't available in this browser.");
      return;
    }

    setBusyAction("copy-image");
    setStatus(null);

    try {
      const pngPromise = renderShareCardPng(svg);
      const item = new ClipboardItem({ "image/png": pngPromise });
      await navigator.clipboard.write([item]);
      setStatus("Image copied to clipboard.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't copy the image.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyCaption = async () => {
    if (!navigator.clipboard?.writeText) {
      setStatus("Clipboard text copy isn't available in this browser.");
      return;
    }

    setBusyAction("copy-caption");
    setStatus(null);

    try {
      await navigator.clipboard.writeText(data.tweetText);
      setStatus("Caption copied.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't copy the caption.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(data.tweetText)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="share-modal-overlay" onClick={onClose} role="presentation">
      <div className="share-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="share-card-title">
        <div className="share-modal-header">
          <div>
            <p className="share-modal-kicker">Share-ready card</p>
            <h2 id="share-card-title">Export a post-worthy snapshot</h2>
            <p className="share-modal-copy">This preview is the exact SVG that gets exported, and it omits repo and session names.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close share preview">
            <X size={18} />
          </button>
        </div>

        <div className="share-modal-body">
          <div className="share-preview-frame">
            <img src={previewUrl} alt="Share card preview" className="share-preview-image" />
          </div>

          <div className="share-actions">
            <button type="button" className="share-action-button primary" onClick={handleDownload} disabled={busyAction !== null}>
              <Download size={16} />
              {busyAction === "download" ? "Exporting..." : "Download PNG"}
            </button>
            <button type="button" className="share-action-button" onClick={handleCopyImage} disabled={busyAction !== null}>
              <ImagePlus size={16} />
              {busyAction === "copy-image" ? "Copying..." : "Copy image"}
            </button>
            <button type="button" className="share-action-button" onClick={handleCopyCaption} disabled={busyAction !== null}>
              <Copy size={16} />
              {busyAction === "copy-caption" ? "Copying..." : "Copy caption"}
            </button>
            <button type="button" className="share-action-button" onClick={handleOpenX} disabled={busyAction !== null}>
              <ExternalLink size={16} />
              Open X
            </button>
          </div>

          <div className="share-caption-box">
            <span className="share-caption-label">Caption</span>
            <p>{data.tweetText}</p>
          </div>

          {status && <p className="share-status">{status}</p>}
        </div>
      </div>
    </div>
  );
}
