"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import {
  destinationsByPriority,
  type NavChild,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export const learningPromoNavigationForms = {
  M: "learning-promo-tabs",
  TP: "learning-promo-portrait-tabs",
  TL: "learning-promo-touch-rail",
  DS: "learning-promo-panel",
  DW: "learning-promo-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type LearningPromoNavigationModel = {
  promotion: {
    eyebrow: string;
    headline: string;
    body: string;
    cta: string;
    actionId: string;
    mediaAlt: string;
    media: {
      avifSrc: string;
      avifSrcSet: string;
      webpSrc: string;
      webpSrcSet: string;
      jpegSrc: string;
      jpegSrcSet: string;
    };
  };
};

export type LearningPromoNavigationReachability = {
  id: string;
  kind: "destination" | "promotion-action" | "promotion-dismiss";
  taps: 1 | 2;
  surface: "first-paint-tab" | "complete-more-sheet" | "touch-popover" | "complete-panel" | "promotion";
};

export function learningPromoNavigationReachability(nav: NavModel, model: LearningPromoNavigationModel, deviceClass: DeviceClass): LearningPromoNavigationReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const touchRail = deviceClass === "TL";
  const destinations = destinationsByPriority(nav);
  return [
    ...destinations.flatMap((destination, index): LearningPromoNavigationReachability[] => [
      {
        id: destination.id,
        kind: "destination",
        taps: compact && index >= 4 ? 2 : touchRail ? 2 : 1,
        surface: compact && index >= 4 ? "complete-more-sheet" : compact ? "first-paint-tab" : touchRail ? "touch-popover" : "complete-panel",
      },
      ...(destination.children ?? []).map(({ id }) => ({
        id,
        kind: "destination" as const,
        taps: 2 as const,
        surface: compact ? "complete-more-sheet" as const : touchRail ? "touch-popover" as const : "complete-panel" as const,
      })),
    ]),
    { id: model.promotion.actionId, kind: "promotion-action", taps: touchRail ? 2 : 1, surface: "promotion" },
    { id: "dismiss-learning-promotion", kind: "promotion-dismiss", taps: touchRail ? 2 : 1, surface: "promotion" },
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-learning-navigation__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function Badge({ destination }: { destination: NavDestination }) {
  if (!destination.badge) return null;
  return <span className="xp-learning-navigation__badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`} data-badge-value={destination.badge.value} data-badge-label={destination.badge.label}>{destination.badge.value}</span>;
}

function Brand({ nav }: { nav: NavModel }) {
  return <a className="xp-learning-navigation__brand" href="#xp-shell-content" data-xp-learning-navigation-identity="" aria-label={nav.identity.label}><span aria-hidden="true"><i /><i /><i /></span><strong>{nav.identity.label}</strong></a>;
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a className="xp-learning-navigation__child" href={child.href} data-nav-child-id={child.id} data-nav-parent-id={parentId}>{child.label}</a>;
}

function DestinationLink({ destination, activeId, renderIcon, surface }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "tab" | "sheet" | "panel" | "popover";
}) {
  const current = destination.id === activeId;
  return <a className="xp-learning-navigation__destination" href={destination.href} data-nav-id={destination.id} data-xp-learning-navigation-surface={surface} data-current={current ? "true" : undefined} aria-current={current && (surface === "tab" || surface === "panel") ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-learning-navigation__label">{destination.label}</span><Badge destination={destination} /></a>;
}

function BranchRow({ destination, activeId, renderIcon, surface, expanded }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; surface: "sheet" | "panel"; expanded: boolean }) {
  const [open, setOpen] = useState(expanded);
  const childrenId = `xp-learning-navigation-${surface}-${destination.id}`;
  return <div className="xp-learning-navigation__branch" data-xp-learning-navigation-branch="" data-nav-branch-id={destination.id} data-branch-open={open ? "true" : "false"}><div className="xp-learning-navigation__branch-row"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} /><button type="button" aria-label={`${open ? "Hide" : "Show"} ${destination.label} destinations`} aria-expanded={open} aria-controls={childrenId} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">⌄</span></button></div>{open ? <div className="xp-learning-navigation__children" id={childrenId}>{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div> : null}</div>;
}

function GroupedTree({ nav, activeId, renderIcon, surface, expanded }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "panel";
  expanded: boolean;
}) {
  const byId = new Map(destinationsByPriority(nav).map((destination) => [destination.id, destination]));
  return <nav className="xp-learning-navigation__tree" aria-label="Learning destinations" data-xp-learning-navigation-tree="" data-navigation-surface={surface}>{nav.groups?.map((group) => <section key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>{group.label ? <h2>{group.label}</h2> : null}<div>{group.destinationIds.map((id) => { const destination = byId.get(id); if (!destination) return null; return destination.children?.length ? <BranchRow key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} expanded={expanded} /> : <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} />; })}</div></section>)}</nav>;
}

function PromotionMedia({ model }: { model: LearningPromoNavigationModel }) {
  const { media, mediaAlt } = model.promotion;
  return <picture className="xp-learning-navigation__picture" data-xp-learning-navigation-picture=""><source type="image/avif" srcSet={media.avifSrcSet} /><source type="image/webp" srcSet={media.webpSrcSet} /><img src={media.jpegSrc} srcSet={media.jpegSrcSet} sizes="(max-width: 767px) 92vw, (max-width: 1180px) 320px, 352px" width={1920} height={1080} alt={mediaAlt} data-xp-learning-navigation-media="" /></picture>;
}

function PromotionCard({ model, presentation, onAction, onDismiss }: {
  model: LearningPromoNavigationModel;
  presentation: "card" | "pane" | "row";
  onAction?: (actionId: string) => void;
  onDismiss: () => void;
}) {
  const promotion = model.promotion;
  return <section className="xp-learning-navigation__promotion" data-xp-learning-navigation-promotion="" data-promo-presentation={presentation} aria-labelledby={`xp-learning-promotion-${presentation}`}><PromotionMedia model={model} /><div className="xp-learning-navigation__promotion-copy"><span>{promotion.eyebrow}</span><h2 id={`xp-learning-promotion-${presentation}`}>{promotion.headline}</h2>{presentation !== "row" ? <p>{promotion.body}</p> : null}<div className="xp-learning-navigation__promotion-actions"><button type="button" className="xp-learning-navigation__promo-action" data-action-id={promotion.actionId} data-xp-learning-navigation-promo-action="" onClick={() => onAction?.(promotion.actionId)}>{promotion.cta}</button><button type="button" className="xp-learning-navigation__promo-dismiss" data-action-id="dismiss-learning-promotion" data-xp-learning-navigation-promo-dismiss="" onClick={onDismiss}>Dismiss</button></div></div></section>;
}

function MoreSheet({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Four first-paint learning routes hand off to one complete grouped and expanded graph with a persistent Close action."><AdaptiveOverlay.Trigger className="xp-learning-navigation__more-trigger" aria-label="More destinations" data-xp-learning-navigation-more-trigger=""><span aria-hidden="true"><i /><i /><i /></span><span>More</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-learning-navigation__more-overlay" data-xp-learning-navigation-more-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="All destinations" description="Training path, help, and preferences" /><AdaptiveOverlay.Body className="xp-learning-navigation__more-body" data-xp-learning-navigation-more-body=""><GroupedTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-learning-navigation__overlay-footer" data-xp-learning-navigation-more-footer=""><AdaptiveOverlay.Close className="xp-learning-navigation__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactTabs({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-learning-navigation__tabs" aria-label="Primary learning destinations" data-xp-learning-navigation-tab-rank="">{destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<MoreSheet nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /></nav>;
}

function RailDestination({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  const current = destination.id === activeId;
  return <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Every learning rail icon opens a labelled, touch-anchored destination pane; branch children stay within two taps."><AdaptiveOverlay.Trigger className="xp-learning-navigation__rail-trigger" aria-label={`Open ${destination.label}`} aria-current={current ? "page" : undefined} data-current={current ? "true" : undefined} data-nav-trigger-id={destination.id} data-xp-learning-navigation-rail-trigger=""><Icon destination={destination} renderIcon={renderIcon} /><Badge destination={destination} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-learning-navigation__rail-overlay" data-xp-learning-navigation-rail-overlay="" data-nav-popover-id={destination.id}><AdaptiveOverlay.Header title={destination.label} description={destination.children?.length ? `${destination.children.length} related destinations` : "Open destination"} /><AdaptiveOverlay.Body className="xp-learning-navigation__rail-body"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface="popover" />{destination.children?.length ? <div className="xp-learning-navigation__children">{destination.children.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div> : null}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-learning-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-learning-navigation__overlay-close">Close destination</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function PromoPane({ model, onAction, onDismiss }: { model: LearningPromoNavigationModel; onAction?: (actionId: string) => void; onDismiss: () => void }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The persistent Quick reference chip opens the single media-rich learning promotion pane within two taps."><AdaptiveOverlay.Trigger className="xp-learning-navigation__promo-trigger" aria-label="Open Quick reference" data-xp-learning-navigation-promo-trigger=""><span aria-hidden="true">↗</span><span>Quick reference</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-learning-navigation__promo-overlay" data-xp-learning-navigation-promo-overlay="" data-device-class="TL"><AdaptiveOverlay.Header title={model.promotion.headline} description={model.promotion.eyebrow} /><AdaptiveOverlay.Body className="xp-learning-navigation__promo-body"><PromotionCard model={model} presentation="pane" onAction={onAction} onDismiss={onDismiss} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-learning-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-learning-navigation__overlay-close">Close reference</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function TouchRail({ nav, model, activeId, renderIcon, dismissed, onAction, onDismiss }: { nav: NavModel; model: LearningPromoNavigationModel; activeId: string; renderIcon?: NavIconRenderer; dismissed: boolean; onAction?: (actionId: string) => void; onDismiss: () => void }) {
  const byId = new Map(destinationsByPriority(nav).map((destination) => [destination.id, destination]));
  return <aside className="xp-learning-navigation__rail" data-xp-learning-navigation-rail=""><Brand nav={nav} /><nav aria-label="Learning destinations">{nav.groups?.map((group) => <section key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label}>{group.label ? <h2 className="xp-visually-hidden">{group.label}</h2> : null}{group.destinationIds.map((id) => { const destination = byId.get(id); return destination ? <RailDestination key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} /> : null; })}</section>)}</nav>{!dismissed ? <PromoPane model={model} onAction={onAction} onDismiss={onDismiss} /> : null}</aside>;
}

function validateLearningPromo(nav: NavModel, model: LearningPromoNavigationModel, activeId: string) {
  const destinations = destinationsByPriority(nav);
  const children = destinations.filter(({ children }) => children?.length);
  const valid = nav.family === "app" && destinations.length === 11
    && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") === "1/7/3"
    && children.map(({ children: items }) => items?.length).join("/") === "3/2"
    && destinations.reduce((count, destination) => count + (destination.children?.length ?? 0), 0) === 5
    && destinations.filter(({ badge }) => badge).map(({ badge }) => badge?.value).join("/") === "3/2"
    && activeId === "console_overview" && model.promotion.actionId === "open_phone_charts"
    && !nav.search && !nav.actions?.length && !nav.utility?.length && !nav.widgets?.length;
  if (!valid) throw new Error("NavModel/learning-promo requires exact 11 routes in 1/7/3 groups, branches 3/2, badges 3/2, current console_overview, one promotion, and no extra jobs.");
}

export function LearningPromoNavigation({ nav, model, activeId, deviceClass, children, renderIcon, onAction, sourceSlug, sourcePreset }: {
  nav: NavModel;
  model: LearningPromoNavigationModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  onAction?: (actionId: string) => void;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  validateLearningPromo(nav, model, activeId);
  const [dismissed, setDismissed] = useState(false);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-learning-navigation-shell" data-xp-shell="" data-xp-learning-navigation-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.learning-promo" data-device-class={deviceClass} data-variant={learningPromoNavigationForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <header className="xp-learning-navigation__command"><Brand nav={nav} /><span>Learning desk</span></header> : null}<div className="xp-learning-navigation__body">{deviceClass === "TL" ? <TouchRail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} dismissed={dismissed} onAction={onAction} onDismiss={() => setDismissed(true)} /> : null}{deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-learning-navigation__panel" data-xp-learning-navigation-panel=""><Brand nav={nav} /><GroupedTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" expanded={false} />{!dismissed ? <PromotionCard model={model} presentation={deviceClass === "DS" ? "row" : "card"} onAction={onAction} onDismiss={() => setDismissed(true)} /> : null}</aside> : null}<main className="xp-learning-navigation__main" id="xp-shell-content" tabIndex={-1}><section className="xp-learning-navigation__work-surface" data-xp-learning-navigation-work-surface="">{compact && !dismissed ? <PromotionCard model={model} presentation="card" onAction={onAction} onDismiss={() => setDismissed(true)} /> : null}{children}</section></main></div>{compact ? <CompactTabs nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}</div>;
}
