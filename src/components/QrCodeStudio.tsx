"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import QRCodeStyling, {
  CornerDotType,
  CornerSquareType,
  DotType,
  DrawType,
  ErrorCorrectionLevel,
  FileExtension,
  GradientType,
  Options,
} from "qr-code-styling";
import { Download, ImageUp, Link2, RefreshCcw, Trash2 } from "lucide-react";
import clsx from "clsx";

const QUIET_ZONE_PRESETS = [
  { label: "None (0px)", value: 0 },
  { label: "Tight (8px)", value: 8 },
  { label: "Normal (12px)", value: 12 },
  { label: "Roomy (16px)", value: 16 },
  { label: "XL (24px)", value: 24 },
  { label: "2XL (32px)", value: 32 },
  { label: "Max (40px)", value: 40 },
] as const;

type GradientState = {
  enabled: boolean;
  type: GradientType;
  rotation: number; // degrees
  color1: string;
  color2: string;
};

type LogoState = {
  enabled: boolean;
  dataUrl: string | null;
  margin: number;
  crossOrigin: "anonymous" | "use-credentials" | undefined;
};

const DOT_TYPES: Array<{ label: string; value: DotType }> = [
  { label: "Rounded", value: "rounded" },
  { label: "Dots", value: "dots" },
  { label: "Classy", value: "classy" },
  { label: "Classy rounded", value: "classy-rounded" },
  { label: "Square", value: "square" },
  { label: "Extra rounded", value: "extra-rounded" },
];

const CORNER_SQUARE_TYPES: Array<{ label: string; value: CornerSquareType }> = [
  { label: "Extra rounded", value: "extra-rounded" },
  { label: "Dot", value: "dot" },
  { label: "Square", value: "square" },
];

const CORNER_DOT_TYPES: Array<{ label: string; value: CornerDotType }> = [
  { label: "Dot", value: "dot" },
  { label: "Square", value: "square" },
];

const ERROR_LEVELS: Array<{ label: string; value: ErrorCorrectionLevel }> = [
  { label: "Low (L)", value: "L" },
  { label: "Medium (M)", value: "M" },
  { label: "Quartile (Q)", value: "Q" },
  { label: "High (H)", value: "H" },
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300/80"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={clsx(
          "w-full appearance-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-10 text-sm text-white",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
          "focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
          "disabled:cursor-not-allowed disabled:opacity-60",
          props.className,
        )}
      />
      <SelectChevron />
    </div>
  );
}

export function QrCodeStudio() {
  const mountDesktopRef = useRef<HTMLDivElement | null>(null);
  const mountMobileRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const studioRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState("https://example.com");
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(12);
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("M");

  const [dotType, setDotType] = useState<DotType>("rounded");
  const [cornerSquareType, setCornerSquareType] =
    useState<CornerSquareType>("extra-rounded");
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>("dot");

  const [bgColor, setBgColor] = useState("#0b0f19");
  const [fgColor, setFgColor] = useState("#f8fafc");
  const [transparentBg, setTransparentBg] = useState(false);

  const [gradient, setGradient] = useState<GradientState>({
    enabled: false,
    type: "linear",
    rotation: 0,
    color1: "#22c55e",
    color2: "#06b6d4",
  });

  const [logo, setLogo] = useState<LogoState>({
    enabled: false,
    dataUrl: null,
    margin: 10,
    crossOrigin: "anonymous",
  });

  const [downloadName, setDownloadName] = useState("qr-code-for-everyone");
  const [downloadExt, setDownloadExt] = useState<FileExtension>("png");
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  type SheetSnap = "mini" | "half" | "full";
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");
  const dragRef = useRef<{
    startY: number;
    startOffset: number;
    active: boolean;
    moved: boolean;
  } | null>(null);
  const touchDragRef = useRef<{ startY: number; startOffset: number } | null>(
    null,
  );
  const sheetHandleRef = useRef<HTMLDivElement | null>(null);
  const lastSheetOffsetRef = useRef<number>(0);

  const getSheetMetrics = () => {
    const vh =
      typeof window !== "undefined" && window.innerHeight
        ? window.innerHeight
        : studioRef.current?.getBoundingClientRect().height ?? 0;
    const handle = 56; // px visible when hidden
    const miniH = Math.round(vh * 0.5);
    const halfH = Math.round(vh * 0.48);
    const fullH = Math.round(vh * 0.92);
    return { vh, handle, miniH, halfH, fullH };
  };

  const snapToOffset = (snap: SheetSnap) => {
    const m = getSheetMetrics();
    const visible =
      snap === "mini"
        ? m.miniH
        : snap === "half"
          ? m.halfH
          : m.fullH;
    return Math.max(0, m.vh - visible);
  };

  const [sheetOffset, setSheetOffset] = useState<number>(0);

  useEffect(() => {
    // set initial offset + keep in sync on resize/orientation
    const apply = () => setSheetOffset(snapToOffset(sheetSnap));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetSnap]);

  // Non-passive touch listener so we can preventDefault and drag on phones
  useEffect(() => {
    const el = sheetHandleRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !touchDragRef.current) return;
      e.preventDefault();
      const dy = e.touches[0]!.clientY - touchDragRef.current.startY;
      const m = getSheetMetrics();
      const next = clamp(
        touchDragRef.current.startOffset + dy,
        0,
        m.vh - m.handle,
      );
      lastSheetOffsetRef.current = next;
      setSheetOffset(next);
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  });

  const commitSnapFromOffset = (offset: number) => {
    const m = getSheetMetrics();
    const clampOffset = Math.min(Math.max(offset, 0), m.vh - m.handle);
    const visible = m.vh - clampOffset;
    const candidates: Array<{ snap: SheetSnap; visible: number }> = [
      { snap: "mini", visible: m.miniH },
      { snap: "half", visible: m.halfH },
      { snap: "full", visible: m.fullH },
    ];
    let best = candidates[0]!;
    let bestDist = Infinity;
    for (const c of candidates) {
      const d = Math.abs(c.visible - visible);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    setSheetSnap(best.snap);
    setSheetOffset(snapToOffset(best.snap));
  };

  const options: Options = useMemo(() => {
    const drawType: DrawType = "canvas";

    return {
      type: drawType,
      data,
      width: size,
      height: size,
      margin,
      qrOptions: { errorCorrectionLevel: ecLevel },
      backgroundOptions: {
        color: transparentBg ? "transparent" : bgColor,
      },
      dotsOptions: {
        type: dotType,
        ...(gradient.enabled
          ? {
              gradient: {
                type: gradient.type,
                rotation: (clamp(gradient.rotation, 0, 360) * Math.PI) / 180,
                colorStops: [
                  { offset: 0, color: gradient.color1 },
                  { offset: 1, color: gradient.color2 },
                ],
              },
            }
          : { color: fgColor }),
      },
      cornersSquareOptions: {
        type: cornerSquareType,
        color: gradient.enabled ? gradient.color1 : fgColor,
      },
      cornersDotOptions: {
        type: cornerDotType,
        color: gradient.enabled ? gradient.color2 : fgColor,
      },
      image: logo.enabled && logo.dataUrl ? logo.dataUrl : undefined,
      // qr-code-styling reads imageOptions fields even when image is unset
      imageOptions: {
        hideBackgroundDots: true,
        margin: clamp(logo.margin, 0, 40),
        ...(logo.crossOrigin ? { crossOrigin: logo.crossOrigin } : {}),
      },
    };
  }, [
    data,
    size,
    margin,
    ecLevel,
    transparentBg,
    bgColor,
    dotType,
    gradient.enabled,
    gradient.type,
    gradient.rotation,
    gradient.color1,
    gradient.color2,
    fgColor,
    cornerSquareType,
    cornerDotType,
    logo.enabled,
    logo.dataUrl,
    logo.margin,
    logo.crossOrigin,
  ]);

  useEffect(() => {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;
    const mount = isDesktop ? mountDesktopRef.current : mountMobileRef.current;
    if (!mount) return;

    if (!qrRef.current) {
      const qr = new QRCodeStyling(options);
      qrRef.current = qr;
      mount.innerHTML = "";
      qr.append(mount);
      return;
    }

    qrRef.current.update(options);
    mount.innerHTML = "";
    qrRef.current.append(mount);
  }, [options]);

  const onUploadLogo = async (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setLogo((l) => ({
        ...l,
        enabled: true,
        dataUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const onClearLogo = () => {
    setLogo({
      enabled: false,
      dataUrl: null,
      margin: 10,
      crossOrigin: "anonymous",
    });
  };

  const onDownload = async () => {
    const qr = qrRef.current;
    if (!qr) return;
    await qr.download({
      name: downloadName || "qr-code",
      extension: downloadExt,
    });
  };

  const headerLinkId = useId();
  const sizeId = useId();
  const marginId = useId();
  const marginCustomId = useId();
  const ecId = useId();
  const dotId = useId();
  const cornerSqId = useId();
  const cornerDotId = useId();
  const fgId = useId();
  const bgId = useId();
  const gradEnabledId = useId();
  const gradTypeId = useId();
  const gradRotId = useId();
  const gradC1Id = useId();
  const gradC2Id = useId();
  const logoEnabledId = useId();
  const logoMarginId = useId();
  const crossOriginId = useId();
  const dlNameId = useId();
  const dlExtId = useId();

  return (
    <div
      ref={studioRef}
      className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6"
    >
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          QR Code For Everyone
        </h1>
        <p className="max-w-2xl text-sm text-zinc-300 md:text-base">
          Paste any link. Customize the style. Download instantly.
        </p>
      </header>

      <div className="grid h-[100svh] grid-cols-1 gap-0 overflow-hidden lg:h-auto lg:grid-cols-[1.1fr_.9fr] lg:gap-6 lg:overflow-visible">
        <section className="h-[100svh] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur lg:h-auto lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Design</h2>
            <button
              type="button"
              onClick={() => {
                setGradient((g) => ({ ...g, enabled: false }));
                setTransparentBg(false);
                setBgColor("#0b0f19");
                setFgColor("#f8fafc");
                setDotType("rounded");
                setCornerSquareType("extra-rounded");
                setCornerDotType("dot");
                setSize(320);
                setMargin(12);
                setEcLevel("M");
                onClearLogo();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor={headerLinkId}
                className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-zinc-200"
              >
                <Link2 className="h-4 w-4 text-zinc-400" />
                Link / text
              </label>
              <input
                id={headerLinkId}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
              <p className="mt-2 text-xs text-zinc-400">
                Tip: You can paste any URL, Wi‑Fi string, or plain text.
              </p>
            </div>

            <div>
              <label
                htmlFor={sizeId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Size ({size}px)
              </label>
              <input
                id={sizeId}
                type="range"
                min={160}
                max={720}
                step={10}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor={marginId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Quiet zone
              </label>
              <SelectField
                id={marginId}
                value={
                  QUIET_ZONE_PRESETS.some((p) => p.value === margin)
                    ? String(margin)
                    : "custom"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") return;
                  setMargin(Number(v));
                }}
              >
                {QUIET_ZONE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="custom">Custom…</option>
              </SelectField>

              {!QUIET_ZONE_PRESETS.some((p) => p.value === margin) && (
                <div className="mt-3">
                  <label
                    htmlFor={marginCustomId}
                    className="mb-2 block text-xs font-medium text-zinc-300"
                  >
                    Custom quiet zone ({margin}px)
                  </label>
                  <input
                    id={marginCustomId}
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor={ecId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Error correction
              </label>
              <SelectField
                id={ecId}
                value={ecLevel}
                onChange={(e) =>
                  setEcLevel(e.target.value as ErrorCorrectionLevel)
                }
              >
                {ERROR_LEVELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <label
                htmlFor={dotId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Dots
              </label>
              <SelectField
                id={dotId}
                value={dotType}
                onChange={(e) => setDotType(e.target.value as DotType)}
              >
                {DOT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <label
                htmlFor={cornerSqId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Corner squares
              </label>
              <SelectField
                id={cornerSqId}
                value={cornerSquareType}
                onChange={(e) =>
                  setCornerSquareType(e.target.value as CornerSquareType)
                }
              >
                {CORNER_SQUARE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <label
                htmlFor={cornerDotId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Corner dots
              </label>
              <SelectField
                id={cornerDotId}
                value={cornerDotType}
                onChange={(e) =>
                  setCornerDotType(e.target.value as CornerDotType)
                }
              >
                {CORNER_DOT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor={fgId}
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Foreground
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                  <input
                    id={fgId}
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg bg-transparent"
                    aria-label="Foreground color"
                  />
                  <input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    aria-label="Foreground hex value"
                    placeholder="#RRGGBB"
                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={bgId}
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Background
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                  <input
                    id={bgId}
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className={clsx(
                      "h-9 w-12 cursor-pointer rounded-lg bg-transparent",
                      transparentBg && "opacity-40",
                    )}
                    aria-label="Background color"
                    disabled={transparentBg}
                  />
                  <input
                    value={transparentBg ? "transparent" : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    aria-label="Background hex value"
                    placeholder="#RRGGBB"
                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none disabled:opacity-50"
                    disabled={transparentBg}
                  />
                  <label className="inline-flex select-none items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={transparentBg}
                      onChange={(e) => setTransparentBg(e.target.checked)}
                      className="accent-emerald-400"
                    />
                    Transparent
                  </label>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor={gradEnabledId}
                  className="inline-flex select-none items-center gap-2 text-sm font-medium text-zinc-100"
                >
                  <input
                    id={gradEnabledId}
                    type="checkbox"
                    checked={gradient.enabled}
                    onChange={(e) =>
                      setGradient((g) => ({ ...g, enabled: e.target.checked }))
                    }
                    className="accent-emerald-400"
                  />
                  Gradient
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">When enabled, it overrides foreground color.</span>
                </div>
              </div>

              <div className={clsx("mt-4 grid grid-cols-1 gap-4 md:grid-cols-4", !gradient.enabled && "opacity-50")}>
                <div className="md:col-span-2">
                  <label
                    htmlFor={gradTypeId}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Type
                  </label>
                  <SelectField
                    id={gradTypeId}
                    value={gradient.type}
                    onChange={(e) =>
                      setGradient((g) => ({
                        ...g,
                        type: e.target.value as GradientType,
                      }))
                    }
                    disabled={!gradient.enabled}
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </SelectField>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor={gradRotId}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Rotation ({Math.round(gradient.rotation)}°)
                  </label>
                  <input
                    id={gradRotId}
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={gradient.rotation}
                    onChange={(e) =>
                      setGradient((g) => ({
                        ...g,
                        rotation: Number(e.target.value),
                      }))
                    }
                    disabled={!gradient.enabled}
                    className="w-full accent-emerald-400 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor={gradC1Id}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Color A
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <input
                      id={gradC1Id}
                      type="color"
                      value={gradient.color1}
                      onChange={(e) =>
                        setGradient((g) => ({ ...g, color1: e.target.value }))
                      }
                      disabled={!gradient.enabled}
                      className="h-9 w-12 cursor-pointer rounded-lg bg-transparent disabled:cursor-not-allowed"
                      aria-label="Gradient color A"
                    />
                    <input
                      value={gradient.color1}
                      onChange={(e) =>
                        setGradient((g) => ({ ...g, color1: e.target.value }))
                      }
                      aria-label="Gradient color A hex value"
                      placeholder="#RRGGBB"
                      disabled={!gradient.enabled}
                      className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={gradC2Id}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Color B
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <input
                      id={gradC2Id}
                      type="color"
                      value={gradient.color2}
                      onChange={(e) =>
                        setGradient((g) => ({ ...g, color2: e.target.value }))
                      }
                      disabled={!gradient.enabled}
                      className="h-9 w-12 cursor-pointer rounded-lg bg-transparent disabled:cursor-not-allowed"
                      aria-label="Gradient color B"
                    />
                    <input
                      value={gradient.color2}
                      onChange={(e) =>
                        setGradient((g) => ({ ...g, color2: e.target.value }))
                      }
                      aria-label="Gradient color B hex value"
                      placeholder="#RRGGBB"
                      disabled={!gradient.enabled}
                      className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor={logoEnabledId}
                  className="inline-flex select-none items-center gap-2 text-sm font-medium text-zinc-100"
                >
                  <input
                    id={logoEnabledId}
                    type="checkbox"
                    checked={logo.enabled}
                    onChange={(e) =>
                      setLogo((l) => ({ ...l, enabled: e.target.checked }))
                    }
                    className="accent-emerald-400"
                  />
                  Logo
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10">
                    <ImageUp className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUploadLogo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={onClearLogo}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div
                className={clsx(
                  "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2",
                  !logo.enabled && "opacity-50",
                )}
              >
                <div>
                  <label
                    htmlFor={logoMarginId}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Logo margin ({logo.margin}px)
                  </label>
                  <input
                    id={logoMarginId}
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={logo.margin}
                    onChange={(e) =>
                      setLogo((l) => ({ ...l, margin: Number(e.target.value) }))
                    }
                    disabled={!logo.enabled}
                    className="w-full accent-emerald-400 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor={crossOriginId}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Cross origin
                  </label>
                  <SelectField
                    id={crossOriginId}
                    value={logo.crossOrigin ?? "anonymous"}
                    onChange={(e) =>
                      setLogo((l) => ({
                        ...l,
                        crossOrigin:
                          e.target.value === "unset"
                            ? undefined
                            : (e.target.value as LogoState["crossOrigin"]),
                      }))
                    }
                    disabled={!logo.enabled}
                  >
                    <option value="anonymous">anonymous</option>
                    <option value="use-credentials">use-credentials</option>
                    <option value="unset">unset</option>
                  </SelectField>
                  <p className="mt-2 text-xs text-zinc-400">
                    For uploaded logos, <span className="text-zinc-300">anonymous</span> is usually best.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside
          className="relative z-20 hidden lg:block rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Preview</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDownloadOptions((v) => !v)}
                className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10 lg:inline-flex"
              >
                Options
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-4 lg:mt-5 lg:p-5">
            <div className="flex items-center justify-center">
              <div
                ref={mountDesktopRef}
                className="grid w-full max-w-[260px] place-items-center overflow-hidden rounded-2xl [&>canvas]:h-auto [&>canvas]:w-full [&>svg]:h-auto [&>svg]:w-full sm:max-w-[320px] lg:max-w-none"
              />
            </div>
          </div>

          <div className="mt-3 lg:mt-5">
            <button
              type="button"
              onClick={() => setShowDownloadOptions((v) => !v)}
              className="inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10 lg:hidden"
            >
              Download options
              <span className="text-zinc-400">
                {showDownloadOptions ? "Hide" : "Show"}
              </span>
            </button>

            <div
              className={clsx(
                "mt-3 grid grid-cols-1 gap-3",
                !showDownloadOptions && "hidden lg:grid",
              )}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={dlNameId}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    File name
                  </label>
                  <input
                    id={dlNameId}
                    value={downloadName}
                    onChange={(e) => setDownloadName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor={dlExtId}
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Format
                  </label>
                  <SelectField
                    id={dlExtId}
                    value={downloadExt}
                    onChange={(e) =>
                      setDownloadExt(e.target.value as FileExtension)
                    }
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WEBP</option>
                    <option value="svg">SVG</option>
                  </SelectField>
                  <p className="mt-2 text-xs text-zinc-400">
                    For print-quality vectors, choose{" "}
                    <span className="text-zinc-300">SVG</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 hidden rounded-2xl border border-white/10 bg-black/20 p-4 lg:block">
            <h3 className="text-sm font-semibold text-white">Good scanning tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>Keep strong contrast between foreground and background.</li>
              <li>Increase error correction if you use a large logo.</li>
              <li>Don’t remove the quiet zone unless you really need to.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Mobile bottom sheet preview */}
      <div className="lg:hidden">
        <div
          className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border border-white/10 bg-white/5 shadow-[0_-1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur"
          style={{
            transform: `translateY(${sheetOffset}px)`,
            transition: dragRef.current?.active ? "none" : "transform 220ms ease",
          }}
        >
          <div
            ref={sheetHandleRef}
            className="touch-none select-none px-4 pt-3"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = {
                startY: e.clientY,
                startOffset: sheetOffset,
                active: true,
                moved: false,
              };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current?.active) return;
              const dy = e.clientY - dragRef.current.startY;
              if (Math.abs(dy) > 2) dragRef.current.moved = true;
              const m = getSheetMetrics();
              const next = clamp(
                dragRef.current.startOffset + dy,
                0,
                m.vh - m.handle,
              );
              setSheetOffset(next);
            }}
            onPointerUp={(e) => {
              const d = dragRef.current;
              dragRef.current = d ? { ...d, active: false } : null;
              commitSnapFromOffset(sheetOffset);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={(e) => {
              dragRef.current = null;
              commitSnapFromOffset(sheetOffset);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              touchDragRef.current = {
                startY: e.touches[0]!.clientY,
                startOffset: sheetOffset,
              };
              lastSheetOffsetRef.current = sheetOffset;
            }}
            onTouchEnd={() => {
              if (touchDragRef.current) {
                commitSnapFromOffset(lastSheetOffsetRef.current);
                touchDragRef.current = null;
              }
            }}
            onTouchCancel={() => {
              touchDragRef.current = null;
              commitSnapFromOffset(lastSheetOffsetRef.current);
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Preview</div>
                <div className="text-xs text-zinc-300">
                  Swipe up/down to resize
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSheetSnap((s) => (s === "full" ? "mini" : "full"))
                  }
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                >
                  {sheetSnap === "full" ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={onDownload}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>

          <div className="relative px-4 pb-5">
            <div className="relative rounded-3xl border border-white/10 bg-black/30 p-4">
              {/* Tap overlay: tap anywhere on preview to expand to full */}
              <button
                type="button"
                className="absolute inset-0 z-10 rounded-3xl cursor-default focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-inset"
                aria-label="Expand preview to full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSheetSnap("full");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setSheetSnap("full");
                }}
              />
              <div className="relative z-0 flex items-center justify-center pointer-events-none [&_canvas]:pointer-events-auto [&_svg]:pointer-events-auto">
                <div
                  ref={mountMobileRef}
                  className={clsx(
                    "grid w-full place-items-center overflow-hidden rounded-2xl [&>canvas]:h-auto [&>canvas]:w-full [&>svg]:h-auto [&>svg]:w-full",
                    sheetSnap === "mini" && "max-w-[180px]",
                    sheetSnap === "half" && "max-w-[260px]",
                    sheetSnap === "full" && "max-w-[360px]",
                  )}
                />
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDownloadOptions((v) => !v)}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10"
              >
                Download options
                <span className="text-zinc-400">
                  {showDownloadOptions ? "Hide" : "Show"}
                </span>
              </button>

              {showDownloadOptions && (
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div>
                    <label
                      htmlFor={dlNameId}
                      className="mb-2 block text-sm font-medium text-zinc-200"
                    >
                      File name
                    </label>
                    <input
                      id={dlNameId}
                      value={downloadName}
                      onChange={(e) => setDownloadName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={dlExtId}
                      className="mb-2 block text-sm font-medium text-zinc-200"
                    >
                      Format
                    </label>
                    <SelectField
                      id={dlExtId}
                      value={downloadExt}
                      onChange={(e) =>
                        setDownloadExt(e.target.value as FileExtension)
                      }
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WEBP</option>
                      <option value="svg">SVG</option>
                    </SelectField>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

