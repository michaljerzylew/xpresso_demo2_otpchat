import type { FeatureMetric } from "./feature-model";

export type FeaturePosterKind = "topology" | "process" | "logic" | "funnel" | "production" | "contact-sheet";
export type FeaturePosterSpec = {
  exportId: string;
  seatId: `med-21-${1 | 2 | 3 | 4 | 5 | 6}`;
  assetKey: `poster-21-${1 | 2 | 3 | 4 | 5 | 6}`;
  kind: FeaturePosterKind;
  title: string;
  metricIds: string[];
  width: 1280;
  height: 720;
  runtimeOwner: "xp-code-art";
};

export const FEATURE_POSTER_SPECS: readonly FeaturePosterSpec[] = [
  {exportId:"features-21-poster-21-1",seatId:"med-21-1",assetKey:"poster-21-1",kind:"topology",title:"Data architecture diagram",metricIds:["met-21-1","met-21-2","met-21-3"],width:1280,height:720,runtimeOwner:"xp-code-art"},
  {exportId:"features-21-poster-21-2",seatId:"med-21-2",assetKey:"poster-21-2",kind:"process",title:"Process flow poster",metricIds:["met-21-4","met-21-5"],width:1280,height:720,runtimeOwner:"xp-code-art"},
  {exportId:"features-21-poster-21-3",seatId:"med-21-3",assetKey:"poster-21-3",kind:"logic",title:"Operational logic poster",metricIds:["met-21-4","met-21-5"],width:1280,height:720,runtimeOwner:"xp-code-art"},
  {exportId:"features-21-poster-21-4",seatId:"med-21-4",assetKey:"poster-21-4",kind:"funnel",title:"Client strategy poster",metricIds:["met-21-6","met-21-7"],width:1280,height:720,runtimeOwner:"xp-code-art"},
  {exportId:"features-21-poster-21-5",seatId:"med-21-5",assetKey:"poster-21-5",kind:"production",title:"Production sequence poster",metricIds:["met-21-8","met-21-9"],width:1280,height:720,runtimeOwner:"xp-code-art"},
  {exportId:"features-21-poster-21-6",seatId:"med-21-6",assetKey:"poster-21-6",kind:"contact-sheet",title:"Final asset poster",metricIds:["met-21-8","met-21-9"],width:1280,height:720,runtimeOwner:"xp-code-art"},
] as const;

const escape = (value:string) => value.replace(/[&<>"']/g,(character) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]!);

export function featurePosterSvg(spec:FeaturePosterSpec,metrics:FeatureMetric[]) {
  const values = spec.metricIds.map((id) => metrics.find((metric) => metric.id === id)).filter(Boolean) as FeatureMetric[];
  if (values.length !== spec.metricIds.length) throw new Error(`${spec.exportId} is missing fixture metrics.`);
  const metricMarkup = values.map((metric,index) => `<g transform="translate(${190 + index * 270} 164)"><text class="label" y="0">${escape(metric.label)}</text><text class="value" y="46">${escape(metric.value)}${escape(metric.unit ?? "")}</text></g>`).join("");
  const artwork:Record<FeaturePosterKind,string>={
    topology:`<g stroke="#61d5a4" stroke-width="6" fill="none"><path d="M640 420L250 290M640 420L390 566M640 420L890 566M640 420L1030 290"/></g><circle cx="640" cy="420" r="102" fill="#8df0c5"/><circle cx="640" cy="420" r="48" fill="#0b1712"/><g fill="#d6e4dc" stroke="#61d5a4" stroke-width="6"><circle cx="250" cy="290" r="58"/><circle cx="390" cy="566" r="58"/><circle cx="890" cy="566" r="58"/><circle cx="1030" cy="290" r="58"/></g>`,
    process:`<path d="M220 430H1060" stroke="#274b3d" stroke-width="18" stroke-linecap="round"/><g>${[0,1,2,3,4].map((index)=>`<g transform="translate(${220+index*210} 360)"><circle cx="0" cy="70" r="52" fill="${index===2?"#8df0c5":"#18382c"}" stroke="#61d5a4" stroke-width="5"/><text x="0" y="82" text-anchor="middle" class="step">0${index+1}</text>${index<4?`<path d="M66 70H144l-20-18m20 18-20 18" fill="none" stroke="#d6e4dc" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`:""}</g>`).join("")}</g>`,
    logic:`<g fill="none" stroke="#61d5a4" stroke-width="6"><path d="M640 300V365M640 475V525M640 475L300 525M640 475L980 525"/></g><rect x="500" y="225" width="280" height="76" rx="38" fill="#d6e4dc"/><path d="M640 340l120 80-120 80-120-80z" fill="#8df0c5"/><rect x="180" y="520" width="250" height="76" rx="24" fill="#18382c" stroke="#61d5a4" stroke-width="5"/><rect x="515" y="520" width="250" height="76" rx="24" fill="#d6e4dc"/><rect x="850" y="520" width="250" height="76" rx="24" fill="#18382c" stroke="#61d5a4" stroke-width="5"/>`,
    funnel:`<g>${[0,1,2,3].map((index)=>{const inset=index*95,y=230+index*90;return `<path d="M${180+inset} ${y}H${1100-inset}L${1040-inset} ${y+60}H${240+inset}Z" fill="${["#8df0c5","#d6e4dc","#315b4b","#61d5a4"][index]}"/>`}).join("")}</g><circle cx="640" cy="594" r="22" fill="#eef8f2"/>`,
    production:`<g>${[0,1,2].map((index)=>`<g transform="translate(${180+index*320} ${260+index%2*38})"><rect width="280" height="245" rx="28" fill="#10251c" stroke="#61d5a4" stroke-width="5"/><circle cx="30" cy="28" r="8" fill="#8df0c5"/><circle cx="55" cy="28" r="8" fill="#d6e4dc"/><path d="M30 75H250M30 112H${205-index*30}M30 149H${235-index*38}" stroke="#d6e4dc" stroke-width="18" stroke-linecap="round"/><rect x="30" y="188" width="${82+index*50}" height="28" rx="14" fill="#8df0c5"/></g>`).join("")}</g><path d="M190 594H1090" stroke="#274b3d" stroke-width="14" stroke-linecap="round"/><circle cx="850" cy="594" r="20" fill="#8df0c5"/>`,
    "contact-sheet":`<defs><linearGradient id="poster-a" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#8df0c5"/><stop offset="1" stop-color="#173e30"/></linearGradient></defs><g>${[0,1,2,3,4,5].map((index)=>{const x=180+(index%3)*310,y=235+Math.floor(index/3)*180;return `<g transform="translate(${x} ${y})"><rect width="300" height="155" rx="22" fill="${index%2?"#153126":"url(#poster-a)"}" stroke="#61d5a4" stroke-width="4"/><circle cx="${66+index*18}" cy="68" r="32" fill="#d6e4dc" opacity=".85"/><path d="M25 130L100 88l50 27 60-47 65 62" fill="none" stroke="#eef8f2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`}).join("")}</g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" role="img" aria-label="${escape(spec.title)}"><style>.title{font:700 34px ui-sans-serif,system-ui;fill:#eef8f2}.label{font:600 18px ui-sans-serif,system-ui;fill:#9db3a8}.value{font:800 38px ui-sans-serif,system-ui;fill:#eef8f2}.step{font:800 26px ui-sans-serif,system-ui;fill:#eef8f2}</style><rect width="1280" height="720" rx="42" fill="#0b1712"/><circle cx="1110" cy="104" r="110" fill="#174a37" opacity=".6"/><text class="title" x="190" y="116">${escape(spec.title)}</text>${metricMarkup}${artwork[spec.kind]}</svg>`;
}

export function featurePosterSpecForSeat(seatId:string) {
  return FEATURE_POSTER_SPECS.find((spec) => spec.seatId === seatId);
}
