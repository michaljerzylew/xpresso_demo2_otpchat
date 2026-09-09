"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { CenteredSplitMarketingShell } from "./centered-split-marketing-shell";
import { EndLinksActionMarketingShell } from "./end-links-action-marketing-shell";
import { CommerceTwoTierMarketingShell } from "./commerce-two-tier-marketing-shell";
import { CenteredSocialTwoTierMarketingShell } from "./centered-social-two-tier-marketing-shell";
import { BalancedThreeZoneMarketingShell } from "./balanced-three-zone-marketing-shell";
import { SignedInMarketingShell, type SignedInMarketingModel } from "./signed-in-marketing-shell";
import { InvertedDualActionMarketingShell } from "./inverted-dual-action-marketing-shell";
import { CenteredCommerceMarketingShell } from "./centered-commerce-marketing-shell";
import { SearchUtilityActionMarketingShell } from "./search-utility-action-marketing-shell";
import { MarketingMicroBar, MarketingNavigation, marketingShellForms } from "./navigation-renderers";
import { validateNavModel, type NavIconRenderer, type NavModel } from "./nav-model";
import type { UtilityMetaModel } from "./utility-meta";

export type MarketingShellProperties = {
  nav: NavModel;
  activeId?: string;
  children: ReactNode;
  utilityMeta?: UtilityMetaModel;
  deviceClass?: DeviceClass;
  renderIcon?: NavIconRenderer;
  onAction?: (actionId: string) => void;
  sourceSlug?: string;
  sourcePreset?: string;
  centeredSplit?: boolean;
  endLinksAction?: boolean;
  commerceTwoTier?: boolean;
  centeredSocialTwoTier?: boolean;
  balancedThreeZone?: boolean;
  signedInMarketing?: SignedInMarketingModel;
  invertedDualAction?: boolean;
  centeredCommerce?: boolean;
  searchUtilityAction?: boolean;
};

export function MarketingShell({ nav, activeId, children, utilityMeta, deviceClass: explicitClass, renderIcon, onAction, sourceSlug, sourcePreset, centeredSplit = false, endLinksAction = false, commerceTwoTier = false, centeredSocialTwoTier = false, balancedThreeZone = false, signedInMarketing, invertedDualAction = false, centeredCommerce = false, searchUtilityAction = false }: MarketingShellProperties) {
  const detectedClass = useDeviceClass();
  const deviceClass = explicitClass ?? detectedClass;
  const errors = validateNavModel(nav);
  if (errors.length) throw new Error(`Invalid NavModel: ${errors.join(" ")}`);
  if (activeId && !nav.destinations.some(({ id }) => id === activeId)) throw new Error(`Active destination ${activeId} is missing from NavModel.`);
  if (searchUtilityAction) {
    const resolvedActiveId = activeId ?? nav.destinations[0]?.id;
    if (!resolvedActiveId) throw new Error("Search utility action shell requires an active destination.");
    return <SearchUtilityActionMarketingShell nav={nav} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</SearchUtilityActionMarketingShell>;
  }
  if (centeredCommerce) {
    return <CenteredCommerceMarketingShell nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</CenteredCommerceMarketingShell>;
  }
  const resolvedActiveId = activeId ?? nav.destinations[0]?.id;
  if (!resolvedActiveId) throw new Error("MarketingShell requires an active destination outside marketing.centered-commerce.");
  if ((sourcePreset === "signed-in-marketing" || sourceSlug === "navbar-component-09") && !signedInMarketing) throw new Error("Signed-in marketing shell requires signedInMarketing data.");
  if (signedInMarketing) {
    return <SignedInMarketingShell nav={nav} model={signedInMarketing} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</SignedInMarketingShell>;
  }
  if (invertedDualAction) {
    return <InvertedDualActionMarketingShell nav={nav} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</InvertedDualActionMarketingShell>;
  }
  if (centeredSplit) {
    return (
      <CenteredSplitMarketingShell
        nav={nav}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </CenteredSplitMarketingShell>
    );
  }
  if (endLinksAction) {
    return (
      <EndLinksActionMarketingShell
        nav={nav}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </EndLinksActionMarketingShell>
    );
  }
  if (commerceTwoTier) {
    return <CommerceTwoTierMarketingShell nav={nav} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</CommerceTwoTierMarketingShell>;
  }
  if (centeredSocialTwoTier) {
    return <CenteredSocialTwoTierMarketingShell nav={nav} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</CenteredSocialTwoTierMarketingShell>;
  }
  if (balancedThreeZone) {
    return <BalancedThreeZoneMarketingShell nav={nav} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>{children}</BalancedThreeZoneMarketingShell>;
  }
  const compact = deviceClass === "M";
  const navigation = (
    <MarketingNavigation
      model={nav}
      activeId={resolvedActiveId}
      deviceClass={deviceClass}
      renderIcon={renderIcon}
      utilityMeta={utilityMeta}
      onUtilityAction={onAction}
    />
  );
  return (
    <div
      className="xp-marketing-shell"
      data-xp-shell=""
      data-shell-family="marketing"
      data-device-class={deviceClass}
      data-variant={marketingShellForms[deviceClass]}
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-marketing-shell__top" data-xp-region="top">
        {compact ? <MarketingMicroBar model={nav} onUtilityAction={onAction} /> : navigation}
      </header>
      <main className="xp-marketing-shell__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-region="content">{children}</main>
      <div className="xp-marketing-shell__bottom" data-xp-region="bottom" data-bottom-owner={compact ? "tab-bar" : "none"}>
        {compact ? navigation : null}
      </div>
    </div>
  );
}
