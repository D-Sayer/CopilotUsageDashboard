import { formatCost, calculateModelCost } from "./pricing";
import type { UsageData } from "./types";
import { formatDate, formatDuration, formatNumber, formatTokens } from "./utils";

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

interface ShareCardStat {
  label: string;
  value: string;
}

interface ShareCardHighlight {
  label: string;
  value: string;
  note: string;
}

export interface ShareCardData {
  badge: string;
  title: string;
  subtitle: string;
  dateRange: string;
  heroValue: string;
  heroLabel: string;
  stats: ShareCardStat[];
  highlights: ShareCardHighlight[];
  footer: string;
  tweetText: string;
}

function stripModelStamp(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function compactModelName(model: string, maxLength = 22): string {
  return truncateText(stripModelStamp(model), maxLength);
}

function buildDateRangeLabel(firstSession?: string, lastSession?: string): string {
  if (firstSession && lastSession) {
    if (firstSession === lastSession) {
      return `Snapshot from ${formatDate(firstSession)}`;
    }
    return `${formatDate(firstSession)} - ${formatDate(lastSession)}`;
  }

  return "Current dashboard snapshot";
}

function buildTweetText(data: ShareCardData): string {
  const draft = `${data.title}: ${data.heroValue} ${data.heroLabel.toLowerCase()}, ${data.stats[0]?.value || "0"} sessions, ${data.stats[1]?.value || "0"} requests. Most-used model: ${data.highlights[0]?.value || "n/a"}. Deepest thread: ${data.highlights[1]?.value || "n/a"}. #GitHubCopilot`;
  return draft.length <= 280 ? draft : truncateText(draft, 277);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildShareCardData(data: UsageData): ShareCardData {
  const { summary, dailyUsage, modelTotals } = data;
  const activeDays = dailyUsage.length;
  const mostUsedModel = summary.shareHighlights.mostUsedModel;
  const deepestThread = summary.shareHighlights.deepestThread;
  const longestSession = summary.shareHighlights.longestSession;
  const peakDay = summary.shareHighlights.peakDay;

  const totalApiCost = modelTotals.reduce((sum, model) => {
    const { cost } = calculateModelCost(
      model.model,
      model.inputTokens,
      model.outputTokens,
      model.cacheReadTokens,
      model.cacheWriteTokens,
      model.reasoningTokens,
    );
    return sum + cost;
  }, 0);
  const hasUnknownModels = modelTotals.some((model) =>
    calculateModelCost(
      model.model,
      model.inputTokens,
      model.outputTokens,
      model.cacheReadTokens,
      model.cacheWriteTokens,
      model.reasoningTokens,
    ).isUnknown,
  );

  const shareData: ShareCardData = {
    badge: "Copilot Usage Snapshot",
    title: "My Copilot usage",
    subtitle: `${formatTokens(summary.totalTokens)} total tokens across ${formatNumber(activeDays)} active days`,
    dateRange: buildDateRangeLabel(summary.firstSession, summary.lastSession),
    heroValue: formatTokens(summary.totalTokens),
    heroLabel: "tokens processed",
    stats: [
      { label: "Sessions", value: formatNumber(summary.totalSessions) },
      { label: "Requests", value: formatNumber(summary.totalRequests) },
      { label: "Premium", value: formatNumber(summary.totalPremiumRequests) },
    ],
    highlights: [
      {
        label: "Most used model",
        value: mostUsedModel ? compactModelName(mostUsedModel.model) : "No data",
        note: mostUsedModel ? `${formatNumber(mostUsedModel.sessions)} sessions` : "No sessions yet",
      },
      {
        label: "Deepest thread",
        value: deepestThread ? `${formatNumber(deepestThread.turns)} turns` : "No data",
        note: deepestThread ? compactModelName(deepestThread.selectedModel) : "No sessions yet",
      },
      {
        label: "Longest session",
        value: longestSession ? formatDuration(longestSession.durationMs) : "No data",
        note: longestSession ? compactModelName(longestSession.selectedModel) : "No duration yet",
      },
      {
        label: "Peak day",
        value: peakDay ? formatTokens(peakDay.tokens) : "No data",
        note: peakDay ? `${formatDate(peakDay.date)} • ${formatNumber(peakDay.requests)} reqs` : "No daily data yet",
      },
    ],
    footer: hasUnknownModels
      ? `API value approx ${formatCost(totalApiCost)} • share-ready and privacy-safe`
      : `API value ${formatCost(totalApiCost)} • share-ready and privacy-safe`,
    tweetText: "",
  };

  shareData.tweetText = buildTweetText(shareData);
  return shareData;
}

export function buildShareCardSvg(data: ShareCardData): string {
  const badge = escapeXml(data.badge);
  const title = escapeXml(data.title);
  const subtitle = escapeXml(data.subtitle);
  const dateRange = escapeXml(data.dateRange);
  const heroValue = escapeXml(data.heroValue);
  const heroLabel = escapeXml(data.heroLabel);
  const footer = escapeXml(data.footer);
  const stats = data.stats.slice(0, 3);
  const highlights = data.highlights.slice(0, 4);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" viewBox="0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}" role="img" aria-label="${title}">
      <defs>
        <clipPath id="cardClip">
          <rect x="48" y="48" width="1104" height="534" rx="8" />
        </clipPath>
      </defs>

      <rect width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" fill="#000000" />
      <rect x="48" y="48" width="1104" height="534" rx="8" fill="#111111" stroke="#222222" />
      <g clip-path="url(#cardClip)">
        <rect x="48" y="48" width="1104" height="72" fill="#0a0a0a" />
        <line x1="48" y1="120" x2="1152" y2="120" stroke="#222222" />
      </g>

      <text x="82" y="91" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" letter-spacing="1.2">${badge.toUpperCase()}</text>
      <circle cx="68" cy="85" r="5" fill="#06b6d4" />

      <text x="80" y="198" fill="#ededed" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="68" font-weight="800">${heroValue}</text>
      <text x="80" y="248" fill="#ededed" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="28" font-weight="600">${heroLabel}</text>
      <text x="80" y="298" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="24">${subtitle}</text>
      <text x="80" y="336" fill="#666666" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="19">${dateRange}</text>

      ${stats
        .map((stat, index) => {
          const x = 820;
          const y = 144 + index * 84;
          return `
            <rect x="${x}" y="${y}" width="260" height="66" rx="8" fill="#0a0a0a" stroke="#222222" />
            <text x="${x + 20}" y="${y + 30}" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="16" font-weight="500">${escapeXml(stat.label)}</text>
            <text x="${x + 20}" y="${y + 56}" fill="#ededed" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="28" font-weight="800">${escapeXml(stat.value)}</text>
          `;
        })
        .join("")}

      <rect x="80" y="382" width="1040" height="138" rx="8" fill="#0a0a0a" stroke="#222222" />
      <rect x="80" y="382" width="1040" height="3" fill="#06b6d4" opacity="0.9" />

      ${highlights
        .map((highlight, index) => {
          const x = 110 + index * 250;
          const noteY = highlight.note.includes("•") ? 490 : 482;
          return `
            <text x="${x}" y="424" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="0.8">${escapeXml(highlight.label.toUpperCase())}</text>
            <text x="${x}" y="462" fill="#ededed" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="27" font-weight="800">${escapeXml(highlight.value)}</text>
            <text x="${x}" y="${noteY}" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="16">${escapeXml(highlight.note)}</text>
            ${index < highlights.length - 1 ? `<line x1="${x + 204}" y1="412" x2="${x + 204}" y2="496" stroke="#222222" />` : ""}
          `;
        })
        .join("")}

      <text x="80" y="558" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="20">${title}</text>
      <text x="1120" y="558" text-anchor="end" fill="#888888" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="17">${footer}</text>
    </svg>
  `.trim();
}

export function createShareCardPreviewUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
}

export async function renderShareCardPng(svg: string): Promise<Blob> {
  const svgUrl = createShareCardPreviewUrl(svg);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Failed to load share card preview"));
      nextImage.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = SHARE_CARD_WIDTH;
    canvas.height = SHARE_CARD_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas rendering is not available in this browser");
    }

    context.drawImage(image, 0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to export share card"));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
