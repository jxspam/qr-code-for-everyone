"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function labelId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

export function QrCodeStudio() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

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
      ...(logo.enabled && logo.dataUrl
        ? {
            image: logo.dataUrl,
            imageOptions: {
              ...(logo.crossOrigin ? { crossOrigin: logo.crossOrigin } : {}),
              margin: clamp(logo.margin, 0, 40),
            },
          }
        : {}),
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
    if (!mountRef.current) return;

    if (!qrRef.current) {
      const qr = new QRCodeStyling(options);
      qrRef.current = qr;
      mountRef.current.innerHTML = "";
      qr.append(mountRef.current);
      return;
    }

    qrRef.current.update(options);
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
    setLogo((l) => ({ ...l, enabled: false, dataUrl: null }));
  };

  const onDownload = async () => {
    const qr = qrRef.current;
    if (!qr) return;
    await qr.download({
      name: downloadName || "qr-code",
      extension: downloadExt,
    });
  };

  const headerLinkId = useMemo(() => labelId("data"), []);
  const sizeId = useMemo(() => labelId("size"), []);
  const marginId = useMemo(() => labelId("margin"), []);
  const ecId = useMemo(() => labelId("ec"), []);
  const dotId = useMemo(() => labelId("dot"), []);
  const cornerSqId = useMemo(() => labelId("cornerSq"), []);
  const cornerDotId = useMemo(() => labelId("cornerDot"), []);
  const fgId = useMemo(() => labelId("fg"), []);
  const bgId = useMemo(() => labelId("bg"), []);
  const gradEnabledId = useMemo(() => labelId("gradEnabled"), []);
  const gradTypeId = useMemo(() => labelId("gradType"), []);
  const gradRotId = useMemo(() => labelId("gradRot"), []);
  const gradC1Id = useMemo(() => labelId("gradC1"), []);
  const gradC2Id = useMemo(() => labelId("gradC2"), []);
  const logoEnabledId = useMemo(() => labelId("logoEnabled"), []);
  const logoMarginId = useMemo(() => labelId("logoMargin"), []);
  const crossOriginId = useMemo(() => labelId("crossOrigin"), []);
  const dlNameId = useMemo(() => labelId("dlName"), []);
  const dlExtId = useMemo(() => labelId("dlExt"), []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <header className="mb-10 flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 text-sm text-zinc-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            QR Code For Everyone
          </span>
          <span className="hidden text-zinc-400 md:inline">
            Beautiful QR codes with live preview, logo, gradient, and downloads
          </span>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Paste any link. Customize the style. Download instantly.
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur lg:p-6">
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
                Quiet zone ({margin}px)
              </label>
              <input
                id={marginId}
                type="range"
                min={0}
                max={40}
                step={1}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor={ecId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Error correction
              </label>
              <select
                id={ecId}
                value={ecLevel}
                onChange={(e) =>
                  setEcLevel(e.target.value as ErrorCorrectionLevel)
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                {ERROR_LEVELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={dotId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Dots
              </label>
              <select
                id={dotId}
                value={dotType}
                onChange={(e) => setDotType(e.target.value as DotType)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                {DOT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={cornerSqId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Corner squares
              </label>
              <select
                id={cornerSqId}
                value={cornerSquareType}
                onChange={(e) =>
                  setCornerSquareType(e.target.value as CornerSquareType)
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                {CORNER_SQUARE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={cornerDotId}
                className="mb-2 block text-sm font-medium text-zinc-200"
              >
                Corner dots
              </label>
              <select
                id={cornerDotId}
                value={cornerDotType}
                onChange={(e) =>
                  setCornerDotType(e.target.value as CornerDotType)
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                {CORNER_DOT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
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
                  <select
                    id={gradTypeId}
                    value={gradient.type}
                    onChange={(e) =>
                      setGradient((g) => ({
                        ...g,
                        type: e.target.value as GradientType,
                      }))
                    }
                    disabled={!gradient.enabled}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
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
                  <select
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
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed"
                  >
                    <option value="anonymous">anonymous</option>
                    <option value="use-credentials">use-credentials</option>
                    <option value="unset">unset</option>
                  </select>
                  <p className="mt-2 text-xs text-zinc-400">
                    For uploaded logos, <span className="text-zinc-300">anonymous</span> is usually best.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Preview</h2>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center justify-center">
              <div
                ref={mountRef}
                className="grid place-items-center overflow-hidden rounded-2xl"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
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
              <select
                id={dlExtId}
                value={downloadExt}
                onChange={(e) => setDownloadExt(e.target.value as FileExtension)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
                <option value="svg">SVG</option>
              </select>
              <p className="mt-2 text-xs text-zinc-400">
                If you need print-quality vectors, choose <span className="text-zinc-300">SVG</span>.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white">Good scanning tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>Keep strong contrast between foreground and background.</li>
              <li>Increase error correction if you use a large logo.</li>
              <li>Don’t remove the quiet zone unless you really need to.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

