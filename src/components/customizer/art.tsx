// رسومات الأثاث المُخصَّصة — ثلاث طبقات لكل نوع كما في الـ spec:
//   data-layer="wood"        الخشب/القاعدة  ← لون ثابت من wood_finishes.color_hex
//   data-layer="fabric-main" القماش          ← fill = pattern الصورة أو لون سادة
//   data-layer="shade"       الظل            ← تدرّج شفاف (أبيض ← شفاف ← أسود)

import type { ComponentType, ReactNode, Ref } from "react";

export type ArtProps = {
  woodColor: string;
  fabricFill: string;
};

const SHADE_ID = "fc-shade";
const PATTERN_ID = "fc-pattern";

function Wood({ color, children }: { color: string; children: ReactNode }) {
  return (
    <g data-layer="wood" fill={color}>
      {children}
    </g>
  );
}

function Fabric({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <g data-layer="fabric-main" fill={fill}>
      {children}
    </g>
  );
}

function Shade({ children }: { children: ReactNode }) {
  return (
    <g data-layer="shade" fill={`url(#${SHADE_ID})`}>
      {children}
    </g>
  );
}

function ArtDefs({ textureUrl }: { textureUrl?: string | null }) {
  return (
    <defs>
      <linearGradient id={SHADE_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
      </linearGradient>
      {textureUrl ? (
        <pattern
          id={PATTERN_ID}
          patternUnits="userSpaceOnUse"
          width="80"
          height="80"
        >
          <image
            href={textureUrl}
            width="80"
            height="80"
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      ) : null}
    </defs>
  );
}

function legs(x1: number, x2: number, top = 205, bottom = 258) {
  return (
    <>
      <rect x={x1} y={top} width="14" height={bottom - top} rx="4" />
      <rect x={x2 - 14} y={top} width="14" height={bottom - top} rx="4" />
    </>
  );
}

const chair: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>{legs(95, 305)}</Wood>
    <Fabric fill={fabricFill}>
      <rect x="90" y="148" width="220" height="56" rx="22" />
      <rect x="112" y="58" width="176" height="100" rx="24" />
    </Fabric>
    <Shade>
      <rect x="90" y="148" width="220" height="56" rx="22" />
      <rect x="112" y="58" width="176" height="100" rx="24" />
    </Shade>
  </>
);

const swivelChair: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>
      <ellipse cx="200" cy="256" rx="78" ry="14" />
      <rect x="192" y="196" width="16" height="56" rx="6" />
    </Wood>
    <Fabric fill={fabricFill}>
      <rect x="112" y="158" width="176" height="50" rx="24" />
      <rect x="124" y="62" width="152" height="104" rx="30" />
    </Fabric>
    <Shade>
      <rect x="112" y="158" width="176" height="50" rx="24" />
      <rect x="124" y="62" width="152" height="104" rx="30" />
    </Shade>
  </>
);

function bedFrame(fabricFill: string, woodColor: string) {
  return {
    wood: (
      <Wood color={woodColor}>
        <rect x="46" y="196" width="308" height="24" rx="8" />
        {legs(56, 344, 214, 258)}
      </Wood>
    ),
    fabric: (
      <Fabric fill={fabricFill}>
        <rect x="34" y="54" width="40" height="150" rx="16" />
        <rect x="56" y="146" width="288" height="54" rx="18" />
      </Fabric>
    ),
    shade: (
      <Shade>
        <rect x="34" y="54" width="40" height="150" rx="16" />
        <rect x="56" y="146" width="288" height="54" rx="18" />
      </Shade>
    ),
  };
}

const singleBed: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => {
  const b = bedFrame(fabricFill, woodColor);
  return (
    <>
      {b.wood}
      {b.fabric}
      {b.shade}
    </>
  );
};

const doubleBed: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => {
  const b = bedFrame(fabricFill, woodColor);
  return (
    <>
      {b.wood}
      {b.fabric}
      {b.shade}
    </>
  );
};

const sofa: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>{legs(80, 320, 208, 254)}</Wood>
    <Fabric fill={fabricFill}>
      <rect x="56" y="140" width="288" height="70" rx="24" />
      <rect x="74" y="62" width="252" height="92" rx="24" />
      <rect x="38" y="112" width="42" height="100" rx="20" />
      <rect x="320" y="112" width="42" height="100" rx="20" />
    </Fabric>
    <Shade>
      <rect x="56" y="140" width="288" height="70" rx="24" />
      <rect x="74" y="62" width="252" height="92" rx="24" />
      <rect x="38" y="112" width="42" height="100" rx="20" />
      <rect x="320" y="112" width="42" height="100" rx="20" />
    </Shade>
  </>
);

const lSofa: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>{legs(96, 330, 208, 254)}</Wood>
    <Fabric fill={fabricFill}>
      <rect x="90" y="140" width="260" height="70" rx="24" />
      <rect x="112" y="62" width="238" height="92" rx="24" />
      <rect x="72" y="112" width="42" height="100" rx="20" />
      <rect x="348" y="112" width="40" height="100" rx="20" />
      <rect x="30" y="176" width="90" height="82" rx="22" />
    </Fabric>
    <Shade>
      <rect x="90" y="140" width="260" height="70" rx="24" />
      <rect x="112" y="62" width="238" height="92" rx="24" />
      <rect x="72" y="112" width="42" height="100" rx="20" />
      <rect x="348" y="112" width="40" height="100" rx="20" />
      <rect x="30" y="176" width="90" height="82" rx="22" />
    </Shade>
  </>
);

const roundSofa: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>
      <rect x="120" y="228" width="14" height="26" rx="5" />
      <rect x="266" y="228" width="14" height="26" rx="5" />
    </Wood>
    <Fabric fill={fabricFill}>
      <ellipse cx="200" cy="168" rx="140" ry="76" />
      <ellipse cx="200" cy="140" rx="104" ry="50" />
    </Fabric>
    <Shade>
      <ellipse cx="200" cy="168" rx="140" ry="76" />
      <ellipse cx="200" cy="140" rx="104" ry="50" />
    </Shade>
  </>
);

const table: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>
      <rect x="54" y="118" width="292" height="22" rx="8" />
      {legs(70, 330, 138, 258)}
    </Wood>
    <Fabric fill={fabricFill}>
      <rect x="54" y="118" width="292" height="10" rx="5" />
    </Fabric>
    <Shade>
      <rect x="54" y="118" width="292" height="22" rx="8" />
    </Shade>
  </>
);

const sideTable: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>
      <ellipse cx="200" cy="140" rx="96" ry="26" />
      <rect x="192" y="150" width="16" height="90" rx="6" />
      <ellipse cx="200" cy="246" rx="60" ry="16" />
    </Wood>
    <Fabric fill={fabricFill}>
      <ellipse cx="200" cy="134" rx="96" ry="26" />
    </Fabric>
    <Shade>
      <ellipse cx="200" cy="140" rx="96" ry="26" />
    </Shade>
  </>
);

const pouf: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>
      <rect x="112" y="216" width="16" height="26" rx="6" />
      <rect x="272" y="216" width="16" height="26" rx="6" />
    </Wood>
    <Fabric fill={fabricFill}>
      <ellipse cx="200" cy="170" rx="112" ry="62" />
      <ellipse cx="200" cy="152" rx="76" ry="34" />
    </Fabric>
    <Shade>
      <ellipse cx="200" cy="170" rx="112" ry="62" />
    </Shade>
  </>
);

const generic: ComponentType<ArtProps> = ({ woodColor, fabricFill }) => (
  <>
    <Wood color={woodColor}>{legs(110, 290, 200, 254)}</Wood>
    <Fabric fill={fabricFill}>
      <rect x="94" y="126" width="212" height="86" rx="26" />
    </Fabric>
    <Shade>
      <rect x="94" y="126" width="212" height="86" rx="26" />
    </Shade>
  </>
);

export const ART: Record<string, ComponentType<ArtProps>> = {
  chair,
  "swivel-chair": swivelChair,
  "single-bed": singleBed,
  "double-bed": doubleBed,
  sofa,
  "l-sofa": lSofa,
  "round-sofa": roundSofa,
  table,
  "side-table": sideTable,
  pouf,
};

export function furnitureFill(
  textureUrl?: string | null,
  color?: string | null,
): string {
  if (textureUrl) return `url(#${PATTERN_ID})`;
  return color ?? "#C9B99A";
}

type FurnitureArtProps = ArtProps & {
  slug: string;
  textureUrl?: string | null;
  className?: string;
  title?: string;
  ref?: Ref<SVGSVGElement>;
};

export function FurnitureArt({
  slug,
  woodColor,
  fabricFill,
  textureUrl,
  className,
  title,
  ref,
}: FurnitureArtProps) {
  const Art = ART[slug] ?? generic;
  return (
    <svg
      ref={ref}
      viewBox="0 0 400 300"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ArtDefs textureUrl={textureUrl} />
      <Art woodColor={woodColor} fabricFill={fabricFill} />
    </svg>
  );
}
