"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import { AppBar, type AppBarModel, type AppBarProperties } from "./app-bar";
import {
  CommerceFooter,
  CommerceContextShell,
  CommercePageBand,
  CommerceTopNavigation,
  type CommerceContextModel,
  type CommercePageBandModel,
} from "./commerce-shell";
import { AppNavigation, TopCommandNavigation, appShellForms, type NavDensity } from "./navigation-renderers";
import { validateNavModel, type NavIconRenderer, type NavModel, type NavWidget } from "./nav-model";
import { RecipientInsetShell, type RecipientInsetModel } from "./recipient-inset-shell";
import { WorkspaceTrialShell, type WorkspaceTrialModel } from "./workspace-trial-shell";
import { LearningPromoShell, type LearningPromoModel } from "./learning-promo-shell";
import { AnalyticsUpsellShell, type AnalyticsUpsellModel } from "./analytics-upsell-shell";
import { AccountLedShell, type AccountIdentityModel } from "./account-led-shell";
import { FilesQuotaShell, type FilesQuotaModel } from "./files-quota-shell";
import { LiveOperationsShell, type LiveOperationsModel } from "./live-operations-shell";
import { LabeledRailShell, type LabeledRailModel } from "./labeled-rail-shell";
import { BrandTwoTierShell, type BrandTwoTierModel } from "./brand-two-tier-shell";
import { InvertedTwoTierShell, type InvertedTwoTierModel } from "./inverted-two-tier-shell";
import { ContextThreeTierShell, type ContextThreeTierModel } from "./context-three-tier-shell";
import { MinimalActionRailShell, type MinimalActionRailModel } from "./minimal-action-rail-shell";
import { CompactInlineShell, type CompactInlineModel } from "./compact-inline-shell";
import { RailPanelOperationsShell, type RailPanelOperationsModel } from "./rail-panel-operations-shell";
import { SectionTwoTierShell, type SectionTwoTierModel } from "./section-two-tier-shell";
import { GreetingCommandShell, type CanvasGreetingModel, type GreetingCommandModel } from "./greeting-command-shell";
import { BrandedCommandActionsShell, type BrandedCommandActionsModel } from "./branded-command-actions-shell";
import { CompactInlineSearchShell, type CompactInlineSearchModel } from "./compact-inline-search-shell";
import { AdminTwoTierShell, type AdminTwoTierModel } from "./admin-two-tier-shell";
import { GroupedBadgesNavigation } from "./grouped-badges-navigation";
import { ProfileLedNavigation, type ProfileLedModel } from "./profile-led-navigation";
import { RailMinimalActionNavigation, type RailMinimalActionModel } from "./rail-minimal-action-navigation";
import { RailLabeledNavigation } from "./rail-labeled-navigation";
import { OperationsLiveNavigation, type OperationsLiveModel } from "./operations-live-navigation";
import { InsetRecipientsNavigation, type InsetRecipientsModel } from "./inset-recipients-navigation";
import { LearningPromoNavigation, type LearningPromoNavigationModel } from "./learning-promo-navigation";
import { WorkspaceTrialNavigation, type WorkspaceTrialNavigationModel } from "./workspace-trial-navigation";
import { AnalyticsUpsellNavigation, type AnalyticsUpsellNavigationModel } from "./analytics-upsell-navigation";
import { FilesQuotaNavigation, type FilesQuotaNavigationModel } from "./files-quota-navigation";
import { DualTierOperationsNavigation, type DualTierOperationsModel } from "./dual-tier-operations-navigation";
import { RouteMinimalAppBar, type RouteMinimalModel } from "./route-minimal-app-bar";
import { SearchDenseActionsAppBar, UtilityIdentityAppBar, type SearchDenseActionsModel, type UtilityIdentityModel } from "./search-dense-actions-app-bar";
import type { RelocationTarget } from "./regions";
import { UtilityMeta, isDashboardFooterUtilityMeta, type UtilityMetaModel } from "./utility-meta";

export type AppShellSkin = "plain" | "inset" | "canvas";
export type AppShellNavPlacement = "side" | "top";

export type AppShellProperties = {
  nav: NavModel;
  appBar: AppBarModel;
  activeId?: string;
  children: ReactNode;
  utilityMeta?: UtilityMetaModel;
  commercePageBand?: CommercePageBandModel;
  commerceContext?: CommerceContextModel;
  recipientInset?: RecipientInsetModel;
  workspaceTrial?: WorkspaceTrialModel;
  learningPromo?: LearningPromoModel;
  analyticsUpsell?: AnalyticsUpsellModel;
  accountIdentity?: AccountIdentityModel;
  filesQuota?: FilesQuotaModel;
  liveOperations?: LiveOperationsModel;
  labeledRail?: LabeledRailModel;
  brandTwoTier?: BrandTwoTierModel;
  invertedTwoTier?: InvertedTwoTierModel;
  contextThreeTier?: ContextThreeTierModel;
  minimalActionRail?: MinimalActionRailModel;
  compactInline?: CompactInlineModel;
  railPanelOperations?: RailPanelOperationsModel;
  sectionTwoTier?: SectionTwoTierModel;
  greetingCommand?: GreetingCommandModel;
  canvasGreeting?: CanvasGreetingModel;
  brandedCommandActions?: BrandedCommandActionsModel;
  compactInlineSearch?: CompactInlineSearchModel;
  adminTwoTier?: AdminTwoTierModel;
  profileLed?: ProfileLedModel;
  railMinimalAction?: RailMinimalActionModel;
  operationsLive?: OperationsLiveModel;
  insetRecipients?: InsetRecipientsModel;
  learningPromoNavigation?: LearningPromoNavigationModel;
  workspaceTrialNavigation?: WorkspaceTrialNavigationModel;
  analyticsUpsellNavigation?: AnalyticsUpsellNavigationModel;
  filesQuotaNavigation?: FilesQuotaNavigationModel;
  dualTierOperations?: DualTierOperationsModel;
  routeMinimal?: RouteMinimalModel;
  searchDenseActions?: SearchDenseActionsModel;
  utilityIdentity?: UtilityIdentityModel;
  deviceClass?: DeviceClass;
  skin?: AppShellSkin;
  navPlacement?: AppShellNavPlacement;
  renderIcon?: NavIconRenderer;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  renderWidget?: (widget: NavWidget, target: RelocationTarget) => ReactNode;
  relocations?: Partial<Record<RelocationTarget, ReactNode>>;
  onAction?: (actionId: string) => void;
  onBack?: () => void;
  sourceSlug?: string;
  sourcePreset?: string;
  navCollapsible?: boolean;
  navDensity?: NavDensity;
  defaultNavDensity?: NavDensity;
  onNavDensityChange?: (density: NavDensity) => void;
};

function WidgetProjection({ widget, target, renderWidget }: {
  widget: NavWidget;
  target: RelocationTarget;
  renderWidget?: AppShellProperties["renderWidget"];
}) {
  return (
    <aside className="xp-shell-widget" data-relocation-target={target} data-widget-id={widget.id} aria-label={widget.label}>
      {renderWidget?.(widget, target) ?? (
        <>
          <span>{widget.label}</span>
          {widget.value ? <strong>{widget.value}</strong> : null}
          {widget.detail ? <small>{widget.detail}</small> : null}
        </>
      )}
    </aside>
  );
}

function RelocationProjection({ nav, deviceClass, relocations, renderWidget }: {
  nav: NavModel;
  deviceClass: DeviceClass;
  relocations?: AppShellProperties["relocations"];
  renderWidget?: AppShellProperties["renderWidget"];
}) {
  const external = Object.entries(relocations ?? {}) as [RelocationTarget, ReactNode][];
  if (!nav.widgets?.length && !external.length) return null;
  return (
    <div className="xp-shell-relocations" aria-label="Relocated workspace context">
      {nav.widgets?.map((widget) => (
        <WidgetProjection key={widget.id} widget={widget} target={widget.relocation[deviceClass]} renderWidget={renderWidget} />
      ))}
      {external.map(([target, content]) => content ? <div key={target} data-relocation-target={target}>{content}</div> : null)}
    </div>
  );
}

export function AppShell({
  nav,
  appBar,
  activeId,
  children,
  utilityMeta,
  commercePageBand,
  commerceContext,
  recipientInset,
  workspaceTrial,
  learningPromo,
  analyticsUpsell,
  accountIdentity,
  filesQuota,
  liveOperations,
  labeledRail,
  brandTwoTier,
  invertedTwoTier,
  contextThreeTier,
  minimalActionRail,
  compactInline,
  railPanelOperations,
  sectionTwoTier,
  greetingCommand,
  canvasGreeting,
  brandedCommandActions,
  compactInlineSearch,
  adminTwoTier,
  profileLed,
  railMinimalAction,
  operationsLive,
  insetRecipients,
  learningPromoNavigation,
  workspaceTrialNavigation,
  analyticsUpsellNavigation,
  filesQuotaNavigation,
  dualTierOperations,
  routeMinimal,
  searchDenseActions,
  utilityIdentity,
  deviceClass: explicitClass,
  skin = "plain",
  navPlacement = "side",
  renderIcon,
  renderActionIcon,
  renderWidget,
  relocations,
  onAction,
  onBack,
  sourceSlug,
  sourcePreset,
  navCollapsible = false,
  navDensity: controlledNavDensity,
  defaultNavDensity = "expanded",
  onNavDensityChange,
}: AppShellProperties) {
  const detectedClass = useDeviceClass();
  const [localNavDensity, setLocalNavDensity] = useState<NavDensity>(defaultNavDensity);
  const deviceClass = explicitClass ?? detectedClass;
  const greetingCommandShell = sourcePreset === "greeting-command" || sourceSlug === "navbar-component-07" || sourceSlug === "dashboard-header-06";
  const canvasGreetingShell = sourcePreset === "canvas-greeting" || sourceSlug === "dashboard-header-18";
  const brandedCommandActionsShell = sourcePreset === "branded-command-actions" || sourceSlug === "navbar-component-08";
  const compactInlineSearchShell = sourcePreset === "compact-inline-search" || sourceSlug === "navbar-component-10";
  const adminTwoTierShell = sourcePreset === "admin-two-tier" || sourceSlug === "navbar-component-13";
  const groupedBadgesShell = sourcePreset === "grouped-badges" || sourceSlug === "dashboard-sidebar-01";
  const profileLedShell = sourcePreset === "profile-led" || sourceSlug === "dashboard-sidebar-02";
  const railMinimalActionShell = sourcePreset === "rail-minimal-action" || sourceSlug === "dashboard-sidebar-03";
  const railLabeledShell = sourcePreset === "rail-labeled" || sourceSlug === "dashboard-sidebar-04";
  const operationsLiveNavigation = sourcePreset === "operations-live" || sourceSlug === "dashboard-sidebar-05";
  const insetRecipientsNavigation = sourcePreset === "inset-recipients" || sourceSlug === "dashboard-sidebar-06";
  const dedicatedLearningPromoNavigation = sourcePreset === "learning-promo" || sourceSlug === "dashboard-sidebar-07";
  const dedicatedWorkspaceTrialNavigation = sourcePreset === "workspace-trial" || sourceSlug === "dashboard-sidebar-08";
  const dedicatedAnalyticsUpsellNavigation = sourcePreset === "analytics-upsell" || sourceSlug === "dashboard-sidebar-09";
  const dedicatedDualTierOperations = sourcePreset === "dual-tier-operations" || sourceSlug === "dashboard-sidebar-11";
  const dedicatedFilesQuotaNavigation = sourceSlug === "dashboard-sidebar-10";
  const routeMinimalShell = sourcePreset === "route-minimal" || sourceSlug === "dashboard-header-01";
  const searchDenseActionsShell = sourcePreset === "search-dense-actions" || sourcePreset === "canvas-centered-search" || sourcePreset === "search-identity-detail" || sourcePreset === "branded-command" || sourcePreset === "fullwidth-command" || sourceSlug === "dashboard-header-02" || sourceSlug === "dashboard-header-03" || sourceSlug === "dashboard-header-04" || sourceSlug === "dashboard-header-05" || sourceSlug === "dashboard-header-09";
  const utilityIdentityShell = sourcePreset === "utility-identity" || sourcePreset === "utility-identity-groups" || sourcePreset === "product-actions" || sourcePreset === "balanced-actions" || sourcePreset === "search-persistent" || sourcePreset === "inverted-search" || sourcePreset === "brand-search" || sourcePreset === "context-strip-controls" || sourcePreset === "context-strip-actions" || sourceSlug === "dashboard-header-07" || sourceSlug === "dashboard-header-08" || sourceSlug === "dashboard-header-10" || sourceSlug === "dashboard-header-11" || sourceSlug === "dashboard-header-12" || sourceSlug === "dashboard-header-13" || sourceSlug === "dashboard-header-14" || sourceSlug === "dashboard-header-15" || sourceSlug === "dashboard-header-16";
  const commerceContextShell = sourcePreset === "commerce-context" || sourceSlug === "dashboard-header-17";
  const errors = validateNavModel(nav);
  if (errors.length) throw new Error(`Invalid NavModel: ${errors.join(" ")}`);
  if (!greetingCommandShell && !canvasGreetingShell && !brandedCommandActionsShell && !compactInlineSearchShell && !adminTwoTierShell && !routeMinimalShell && !searchDenseActionsShell && !utilityIdentityShell && !commerceContextShell && !nav.destinations.some((destination) => destination.id === activeId || destination.children?.some(({ id }) => id === activeId))) {
    throw new Error(`Active destination ${activeId} is missing from NavModel.`);
  }
  const compact = deviceClass === "M" || deviceClass === "TP";
  const dashboardFooterMeta = utilityMeta && isDashboardFooterUtilityMeta(utilityMeta) ? utilityMeta : undefined;
  const navigationUtilityMeta = dashboardFooterMeta && !compact ? undefined : utilityMeta;
  const topCommand = sourcePreset === "command-two-rank" || sourceSlug === "application-shell-03";
  const commerce = sourcePreset === "commerce-kpi" || sourceSlug === "application-shell-04";
  const recipientShell = sourcePreset === "recipient-inset" || sourceSlug === "application-shell-05";
  const workspaceTrialShell = sourcePreset === "workspace-side" || sourceSlug === "application-shell-06";
  const learningPromoShell = sourcePreset === "learning-inset" || sourceSlug === "application-shell-07";
  const analyticsUpsellShell = sourcePreset === "analytics-inset" || sourceSlug === "application-shell-08";
  const accountLedShell = sourcePreset === "identity-side" || sourceSlug === "application-shell-09";
  const filesQuotaShell = !dedicatedFilesQuotaNavigation && (sourcePreset === "files-quota" || sourceSlug === "application-shell-10");
  const liveOperationsShell = sourcePreset === "live-operations" || sourceSlug === "application-shell-11";
  const labeledRailShell = sourcePreset === "labeled-rail" || sourceSlug === "application-shell-12";
  const brandTwoTierShell = sourcePreset === "brand-two-tier" || sourceSlug === "application-shell-13";
  const invertedTwoTierShell = sourcePreset === "contrast-two-tier" || sourceSlug === "application-shell-14";
  const contextThreeTierShell = sourcePreset === "context-three-tier" || sourceSlug === "application-shell-15";
  const minimalActionRailShell = sourcePreset === "minimal-rail" || sourceSlug === "application-shell-16";
  const compactInlineShell = sourcePreset === "compact-top" || sourceSlug === "application-shell-17";
  const railPanelOperationsShell = !dedicatedDualTierOperations && (sourcePreset === "logistics-dual-tier" || sourceSlug === "application-shell-18");
  const sectionTwoTierShell = sourcePreset === "app-two-tier" || sourceSlug === "navbar-component-06";
  const resolvedActiveId = activeId ?? nav.destinations[0]?.id ?? "";
  const dedicatedTop = topCommand || commerce;
  if (commerce && !commercePageBand) throw new Error("Commerce KPI shell requires commercePageBand data.");
  if (commerce && commercePageBand?.metrics.length !== 4) throw new Error("Commerce KPI shell requires exactly four metrics.");
  if (commerceContextShell && (!commerceContext || !commercePageBand)) throw new Error("Commerce context shell requires commerce panels and page-band data.");
  if (commerceContextShell && (nav.destinations.length !== 5 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "0/6/5/5/3")) throw new Error("Commerce context shell requires exact 0/6/5/5/3 navigation anatomy.");
  if (commerceContextShell && (nav.search || nav.destinations.some(({ id }) => id === activeId))) throw new Error("Commerce context shell must not invent search or an active route.");
  if (commerceContextShell && (appBar.actions?.map(({ id }) => id).join("/") !== "action-saved-uniforms/action-order-basket/action-tailor-account" || appBar.actions?.some(({ badge }) => badge !== undefined))) throw new Error("Commerce context shell requires exact unbadged saved, basket, and account controls.");
  if (commerceContextShell && (commercePageBand?.breadcrumb.length !== 3 || commercePageBand.metrics.length !== 4 || commercePageBand.breadcrumb.filter(({ href }) => href).length !== 2)) throw new Error("Commerce context shell requires a 2-link/1-current breadcrumb and four KPIs.");
  if (commerceContextShell && (commerceContext?.panels.saved.rows.length !== 3 || commerceContext.panels.basket.declaredCount !== 3 || commerceContext.panels.basket.rows.length !== 2 || commerceContext.panels.basket.finalActions.length !== 2 || commerceContext.accountGroups.map(({ items }) => items.length).join("/") !== "3/3/1")) throw new Error("Commerce context shell requires exact saved, basket, and account panel anatomy.");
  if (recipientShell && !recipientInset) throw new Error("Recipient inset shell requires recipientInset data.");
  if (recipientShell && recipientInset?.recipients.length !== 6) throw new Error("Recipient inset shell requires exactly six recipients.");
  if (recipientShell && recipientInset?.operationCards.length !== 3) throw new Error("Recipient inset shell requires exactly three operation cards.");
  if (workspaceTrialShell && !workspaceTrial) throw new Error("Workspace trial shell requires workspaceTrial data.");
  if (workspaceTrialShell && workspaceTrial?.workspaceOptions.length !== 3) throw new Error("Workspace trial shell requires exactly three workspace options.");
  if (learningPromoShell && !learningPromo) throw new Error("Learning promo shell requires learningPromo data.");
  if (analyticsUpsellShell && !analyticsUpsell) throw new Error("Analytics upsell shell requires analyticsUpsell data.");
  if (accountLedShell && !accountIdentity) throw new Error("Account-led shell requires accountIdentity data.");
  if (accountLedShell && accountIdentity?.identity.socialUtilities.length !== 4) throw new Error("Account-led shell requires exactly four social utilities.");
  if (filesQuotaShell && !filesQuota) throw new Error("Files quota shell requires filesQuota data.");
  if (filesQuotaShell && filesQuota?.footerUtilities.length !== 4) throw new Error("Files quota shell requires exactly four footer utilities.");
  if (filesQuotaShell && filesQuota && filesQuota.storageQuota.used >= filesQuota.storageQuota.total) throw new Error("Files quota shell requires used storage below total storage.");
  if (liveOperationsShell && !liveOperations) throw new Error("Live operations shell requires liveOperations data.");
  if (liveOperationsShell && liveOperations?.liveOperation.staff.length !== 4) throw new Error("Live operations shell requires exactly four staff entries.");
  if (labeledRailShell && !labeledRail) throw new Error("Labeled rail shell requires labeledRail data.");
  if (labeledRailShell && nav.destinations.length !== 9) throw new Error("Labeled rail shell requires exactly nine destinations.");
  if (labeledRailShell && labeledRail?.breadcrumb.length !== 3) throw new Error("Labeled rail shell requires exactly three breadcrumb items.");
  if (labeledRailShell && labeledRail?.footerUtilities.length !== 4) throw new Error("Labeled rail shell requires exactly four footer utilities.");
  if (brandTwoTierShell && !brandTwoTier) throw new Error("Brand two-tier shell requires brandTwoTier data.");
  if (brandTwoTierShell && nav.destinations.length !== 6) throw new Error("Brand two-tier shell requires exactly six destinations.");
  if (brandTwoTierShell && nav.destinations.filter(({ children }) => children?.length).length !== 2) throw new Error("Brand two-tier shell requires exactly two branches.");
  if (brandTwoTierShell && brandTwoTier?.footerUtilities.length !== 4) throw new Error("Brand two-tier shell requires exactly four footer utilities.");
  if (invertedTwoTierShell && !invertedTwoTier) throw new Error("Inverted two-tier shell requires invertedTwoTier data.");
  if (invertedTwoTierShell && nav.destinations.length !== 5) throw new Error("Inverted two-tier shell requires exactly five destinations.");
  if (invertedTwoTierShell && nav.destinations.filter(({ children }) => children?.length).length !== 3) throw new Error("Inverted two-tier shell requires exactly three branches.");
  if (invertedTwoTierShell && nav.destinations.reduce((count, destination) => count + (destination.children?.length ?? 0), 0) !== 6) throw new Error("Inverted two-tier shell requires exactly six child destinations.");
  if (invertedTwoTierShell && invertedTwoTier?.footerUtilities.length !== 4) throw new Error("Inverted two-tier shell requires exactly four footer utilities.");
  if (contextThreeTierShell && !contextThreeTier) throw new Error("Context three-tier shell requires contextThreeTier data.");
  if (contextThreeTierShell && nav.destinations.length !== 6) throw new Error("Context three-tier shell requires exactly six destinations.");
  if (contextThreeTierShell && contextThreeTier?.breadcrumb.length !== 3) throw new Error("Context three-tier shell requires exactly three breadcrumb items.");
  if (contextThreeTierShell && contextThreeTier?.contextActions.length !== 2) throw new Error("Context three-tier shell requires exactly two context actions.");
  if (contextThreeTierShell && contextThreeTier?.footerUtilities.length !== 4) throw new Error("Context three-tier shell requires exactly four footer utilities.");
  if (minimalActionRailShell && !minimalActionRail) throw new Error("Minimal action rail shell requires minimalActionRail data.");
  if (minimalActionRailShell && nav.destinations.length !== 12) throw new Error("Minimal action rail shell requires exactly twelve destinations.");
  if (minimalActionRailShell && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "3/5/4") throw new Error("Minimal action rail shell requires destination groups sized 3/5/4.");
  if (minimalActionRailShell && minimalActionRail?.footerLinks.length !== 5) throw new Error("Minimal action rail shell requires exactly five footer links.");
  if (compactInlineShell && !compactInline) throw new Error("Compact inline shell requires compactInline data.");
  if (compactInlineShell && nav.search) throw new Error("Compact inline shell must not invent search.");
  if (compactInlineShell && nav.destinations.length !== 5) throw new Error("Compact inline shell requires exactly five top-level destinations.");
  if (compactInlineShell && nav.destinations.filter(({ children }) => children?.length).length !== 3) throw new Error("Compact inline shell requires exactly three branches.");
  if (brandedCommandActionsShell && !brandedCommandActions) throw new Error("Branded command actions shell requires brandedCommandActions data.");
  if (brandedCommandActionsShell && nav.destinations.length !== 0) throw new Error("Branded command actions shell must not own destinations.");
  if (brandedCommandActionsShell && (nav.utility ?? []).length !== 3) throw new Error("Branded command actions shell requires exactly three utilities.");
  if (brandedCommandActionsShell && !appBar.search) throw new Error("Branded command actions shell requires real search data.");
  if (compactInlineSearchShell && !compactInlineSearch) throw new Error("Compact inline search shell requires compactInlineSearch data.");
  if (compactInlineSearchShell && nav.destinations.length !== 0) throw new Error("Compact inline search shell must not own destinations.");
  if (compactInlineSearchShell && (nav.utility ?? []).length !== 3) throw new Error("Compact inline search shell requires exactly three utilities.");
  if (compactInlineSearchShell && !appBar.search) throw new Error("Compact inline search shell requires real search data.");
  if (adminTwoTierShell && !adminTwoTier) throw new Error("Admin two-tier shell requires adminTwoTier data.");
  if (adminTwoTierShell && nav.family !== "two-tier") throw new Error("Admin two-tier shell requires one two-tier NavModel.");
  if (adminTwoTierShell && nav.destinations.length !== 5) throw new Error("Admin two-tier shell requires exactly five destination groups.");
  if (adminTwoTierShell && nav.destinations.reduce((count, destination) => count + (destination.children?.length ?? 0), 0) !== 22) throw new Error("Admin two-tier shell requires exactly 22 child destinations.");
  if (profileLedShell && !profileLed) throw new Error("Profile-led navigation requires profileLed data.");
  if (profileLedShell && nav.destinations.length !== 14) throw new Error("Profile-led navigation requires exactly fourteen destinations.");
  if (profileLedShell && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "1/8/5") throw new Error("Profile-led navigation requires destination groups sized 1/8/5.");
  if (profileLedShell && profileLed?.identity.socialUtilities.length !== 4) throw new Error("Profile-led navigation requires exactly four social utilities.");
  if (profileLedShell && profileLed?.footerLinks.length !== 1) throw new Error("Profile-led navigation requires exactly one brand footer link.");
  if (railMinimalActionShell && !railMinimalAction) throw new Error("Rail-minimal-action navigation requires priority action data.");
  if (railMinimalActionShell && nav.destinations.length !== 12) throw new Error("Rail-minimal-action navigation requires exactly twelve destinations.");
  if (railMinimalActionShell && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "3/5/4") throw new Error("Rail-minimal-action navigation requires destination groups sized 3/5/4.");
  if (railLabeledShell && nav.destinations.length !== 9) throw new Error("Rail-labeled navigation requires exactly nine destinations.");
  if (railLabeledShell && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "3/3/2") throw new Error("Rail-labeled navigation requires destination groups sized 3/3/2.");
  if (operationsLiveNavigation && !operationsLive) throw new Error("Operations-live navigation requires live-operation data.");
  if (operationsLiveNavigation && nav.destinations.length !== 13) throw new Error("Operations-live navigation requires exactly thirteen top-level destinations.");
  if (operationsLiveNavigation && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "8/5") throw new Error("Operations-live navigation requires destination groups sized 8/5.");
  if (operationsLiveNavigation && nav.destinations.filter(({ children }) => children?.length).map(({ children }) => children?.length).join("/") !== "2/2") throw new Error("Operations-live navigation requires exactly two branches with two children each.");
  if (insetRecipientsNavigation && !insetRecipients) throw new Error("Inset-recipients navigation requires recipients and account data.");
  if (insetRecipientsNavigation && nav.destinations.length !== 8) throw new Error("Inset-recipients navigation requires exactly eight top-level destinations.");
  if (insetRecipientsNavigation && nav.destinations.filter(({ children }) => children?.length).map(({ children }) => children?.length).join("/") !== "3/2/3/3/2/3/2") throw new Error("Inset-recipients navigation requires exact branch counts 3/2/3/3/2/3/2.");
  if (insetRecipientsNavigation && insetRecipients?.recipients.length !== 6) throw new Error("Inset-recipients navigation requires exactly six recipients.");
  if (dedicatedLearningPromoNavigation && !learningPromoNavigation) throw new Error("Learning-promo navigation requires one promotion source.");
  if (dedicatedLearningPromoNavigation && nav.destinations.length !== 11) throw new Error("Learning-promo navigation requires exactly eleven top-level destinations.");
  if (dedicatedWorkspaceTrialNavigation && !workspaceTrialNavigation) throw new Error("Workspace-trial navigation requires one workspace and trial model.");
  if (dedicatedWorkspaceTrialNavigation && workspaceTrialNavigation?.workspaceOptions.length !== 4) throw new Error("Workspace-trial navigation requires exactly four workspace options.");
  if (dedicatedWorkspaceTrialNavigation && nav.destinations.length !== 9) throw new Error("Workspace-trial navigation requires exactly nine top-level destinations.");
  if (dedicatedWorkspaceTrialNavigation && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "1/8") throw new Error("Workspace-trial navigation requires destination groups sized 1/8.");
  if (dedicatedWorkspaceTrialNavigation && nav.destinations.filter(({ children }) => children?.length).map(({ children }) => children?.length).join("/") !== "3/4") throw new Error("Workspace-trial navigation requires branch counts 3/4.");
  if (dedicatedAnalyticsUpsellNavigation && !analyticsUpsellNavigation) throw new Error("Analytics-upsell navigation requires one upsell source.");
  if (dedicatedAnalyticsUpsellNavigation && nav.destinations.length !== 10) throw new Error("Analytics-upsell navigation requires exactly ten top-level destinations.");
  if (dedicatedAnalyticsUpsellNavigation && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "1/7/2") throw new Error("Analytics-upsell navigation requires destination groups sized 1/7/2.");
  if (dedicatedAnalyticsUpsellNavigation && nav.destinations.filter(({ children }) => children?.length).map(({ children }) => children?.length).join("/") !== "3/2") throw new Error("Analytics-upsell navigation requires branch counts 3/2.");
  if (dedicatedFilesQuotaNavigation && !filesQuotaNavigation) throw new Error("Files-quota navigation requires one storage quota source.");
  if (dedicatedFilesQuotaNavigation && nav.destinations.length !== 11) throw new Error("Files-quota navigation requires exactly eleven top-level destinations.");
  if (dedicatedFilesQuotaNavigation && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "1/5/5") throw new Error("Files-quota navigation requires destination groups sized 1/5/5.");
  if (dedicatedFilesQuotaNavigation && nav.destinations.filter(({ children }) => children?.length).map(({ children }) => children?.length).join("/") !== "2/2") throw new Error("Files-quota navigation requires branch counts 2/2.");
  if (dedicatedFilesQuotaNavigation && !nav.search?.placeholder.trim()) throw new Error("Files-quota navigation requires a real search source.");
  if (dedicatedDualTierOperations && !dualTierOperations) throw new Error("Dual-tier operations navigation requires one operational data source.");
  if (dedicatedDualTierOperations && nav.destinations.length !== 7) throw new Error("Dual-tier operations navigation requires exactly seven rail destinations.");
  if (dedicatedDualTierOperations && nav.destinations.some(({ badge, children }) => badge || children?.length)) throw new Error("Dual-tier operations navigation must not own badges or children.");
  if (dedicatedDualTierOperations && (nav.search || nav.utility?.length || nav.actions?.length)) throw new Error("Dual-tier operations navigation must not invent search, utilities or actions.");
  if (dedicatedDualTierOperations && dualTierOperations?.metrics.map(({ value }) => value).join("/") !== "25900/4600") throw new Error("Dual-tier operations navigation requires exact source metrics 25900/4600.");
  if (dedicatedDualTierOperations && (dualTierOperations?.progress.value !== 30 || dualTierOperations.progress.total !== 100)) throw new Error("Dual-tier operations navigation requires exact source progress 30/100.");
  if (dedicatedDualTierOperations && dualTierOperations?.pageCards.length !== 6) throw new Error("Dual-tier operations navigation requires exactly six page cards.");
  if (dedicatedDualTierOperations && dualTierOperations?.operationLinks.length !== 6) throw new Error("Dual-tier operations navigation requires exactly six operation links.");
  if (compactInlineShell && nav.destinations.reduce((count, destination) => count + (destination.children?.length ?? 0), 0) !== 6) throw new Error("Compact inline shell requires exactly six child destinations.");
  if (compactInlineShell && compactInline?.footerUtilities.length !== 4) throw new Error("Compact inline shell requires exactly four footer utilities.");
  if (railPanelOperationsShell && !railPanelOperations) throw new Error("Rail-panel operations shell requires railPanelOperations data.");
  if (railPanelOperationsShell && nav.destinations.length !== 7) throw new Error("Rail-panel operations shell requires exactly seven rail destinations.");
  if (railPanelOperationsShell && railPanelOperations?.metrics.length !== 2) throw new Error("Rail-panel operations shell requires exactly two metrics.");
  if (railPanelOperationsShell && railPanelOperations?.progress.total !== 100) throw new Error("Rail-panel operations progress total must be 100.");
  if (railPanelOperationsShell && railPanelOperations && railPanelOperations.progress.value > railPanelOperations.progress.total) throw new Error("Rail-panel operations progress cannot exceed its total.");
  if (railPanelOperationsShell && railPanelOperations?.pageCards.length !== 6) throw new Error("Rail-panel operations shell requires exactly six page cards.");
  if (railPanelOperationsShell && railPanelOperations?.operationLinks.length !== 6) throw new Error("Rail-panel operations shell requires exactly six operation links.");
  if (sectionTwoTierShell && !sectionTwoTier) throw new Error("Section two-tier shell requires sectionTwoTier data.");
  if (sectionTwoTierShell && nav.destinations.length !== 8) throw new Error("Section two-tier shell requires exactly eight destinations.");
  if (sectionTwoTierShell && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") !== "3/5") throw new Error("Section two-tier shell requires destination groups sized 3/5.");
  if (sectionTwoTierShell && nav.utility?.length !== 1) throw new Error("Section two-tier shell requires exactly one notification utility.");
  if (sectionTwoTierShell && nav.utility?.[0]?.badge?.value !== 1) throw new Error("Section two-tier shell requires notification badge value 1.");
  if (greetingCommandShell && !greetingCommand) throw new Error("Greeting command shell requires greetingCommand data.");
  if (greetingCommandShell && nav.destinations.length !== 0) throw new Error("Greeting command shell must not mount navigation destinations.");
  if (greetingCommandShell && sourceSlug === "dashboard-header-06" && nav.utility?.length !== 3) throw new Error("Dashboard header greeting command requires exactly three closed-chrome utilities.");
  if (greetingCommandShell && sourceSlug === "dashboard-header-06" && nav.utility?.[2]?.badge?.value !== 8) throw new Error("Dashboard header greeting command notices require badge value 8.");
  if (greetingCommandShell && sourceSlug === "dashboard-header-06" && (!greetingCommand?.boxedShellControl || greetingCommand.languageChoices?.length !== 5 || greetingCommand.accountGroups?.map(({ items }) => items.length).join("/") !== "3/3/1")) throw new Error("Dashboard header greeting command requires its boxed shell control, five locales, and account ranks 3/3/1.");
  if (greetingCommandShell && sourceSlug !== "dashboard-header-06" && nav.utility?.length !== 4) throw new Error("Greeting command shell requires exactly four command utilities.");
  if (greetingCommandShell && sourceSlug !== "dashboard-header-06" && nav.utility?.[1]?.badge?.value !== 1) throw new Error("Greeting command notices require badge value 1.");
  if (greetingCommandShell && sourceSlug !== "dashboard-header-06" && nav.utility?.[2]?.badge?.value !== 2) throw new Error("Greeting command messages require badge value 2.");
  if (greetingCommandShell && !appBar.search) throw new Error("Greeting command shell requires real search data.");
  if (canvasGreetingShell && !canvasGreeting) throw new Error("Canvas greeting shell requires canvasGreeting data.");
  if (canvasGreetingShell && (nav.destinations.length || nav.groups?.length || nav.actions?.length || nav.widgets?.length)) throw new Error("Canvas greeting shell must not mount routes, groups, actions or widgets.");
  if (canvasGreetingShell && (!appBar.search || nav.utility?.length !== 3 || nav.utility[2]?.badge?.value !== 8)) throw new Error("Canvas greeting shell requires real search and exact language/activity/notification utilities with badge value 8.");
  if (canvasGreetingShell && (!canvasGreeting?.boxedShellControl || canvasGreeting.summaries.length !== 3 || canvasGreeting.languageChoices?.length !== 5 || canvasGreeting.accountGroups?.map(({ items }) => items.length).join("/") !== "3/3/1")) throw new Error("Canvas greeting shell requires its shell control, three summaries, five locales and account ranks 3/3/1.");
  if (routeMinimalShell && !routeMinimal) throw new Error("Route-minimal AppBar requires route, locale, account and avatar data.");
  if (routeMinimalShell && nav.destinations.length !== 0) throw new Error("Route-minimal AppBar must not own destinations.");
  if (routeMinimalShell && (nav.search || nav.actions?.length || nav.widgets?.length)) throw new Error("Route-minimal AppBar must not invent search, actions or widgets.");
  if (routeMinimalShell && routeMinimal?.breadcrumb.length !== 3) throw new Error("Route-minimal AppBar requires exactly three breadcrumb nodes.");
  if (routeMinimalShell && routeMinimal?.languageChoices.length !== 5) throw new Error("Route-minimal AppBar requires exactly five language choices.");
  if (routeMinimalShell && routeMinimal?.accountGroups.map(({ items }) => items.length).join("/") !== "3/3/1") throw new Error("Route-minimal AppBar requires account command groups sized 3/3/1.");
  if (searchDenseActionsShell && !searchDenseActions) throw new Error("Search-dense-actions AppBar requires search, utilities, locale, account and avatar data.");
  if (searchDenseActionsShell && nav.destinations.length !== 0) throw new Error("Search-dense-actions AppBar must not own destinations.");
  if (searchDenseActionsShell && (nav.search || nav.actions?.length || nav.widgets?.length || nav.utility?.length)) throw new Error("Search-dense-actions AppBar owns its header jobs without duplicate NavModel projections.");
  const expectedDenseUtilityCount = searchDenseActions?.appearance === "identity-detail" || searchDenseActions?.appearance === "branded-command" || searchDenseActions?.appearance === "fullwidth-command" ? 3 : 4;
  if (searchDenseActionsShell && searchDenseActions?.utilities.length !== expectedDenseUtilityCount) throw new Error(`Search-dense-actions AppBar requires exactly ${expectedDenseUtilityCount} ordered utilities for this appearance.`);
  if (searchDenseActions?.appearance === "branded-command" && (!searchDenseActions.brand?.label || !searchDenseActions.brand.shortLabel)) throw new Error("Branded-command AppBar requires one independent product identity.");
  if (searchDenseActions?.appearance === "fullwidth-command" && (!searchDenseActions.brand?.label || !searchDenseActions.brand.shortLabel || !searchDenseActions.brand.href || nav.identity.href !== searchDenseActions.brand.href)) throw new Error("Fullwidth-command AppBar requires one top-placed NavModel identity with a real home binding.");
  if (searchDenseActions?.appearance === "fullwidth-command" && (nav.groups?.length || searchDenseActions.identityPresentation !== "compact" || searchDenseActions.searchGroups?.map(({ items }) => items.length).join("/") !== "3/2/2")) throw new Error("Fullwidth-command AppBar requires zero navigation groups, compact account chrome, and search-provider ranks 3/2/2.");
  if (searchDenseActionsShell && searchDenseActions?.utilities.at(-1)?.badge?.value !== 8) throw new Error("Search-dense-actions notice utility requires badge value 8.");
  if (searchDenseActionsShell && searchDenseActions?.languageChoices.length !== 5) throw new Error("Search-dense-actions AppBar requires exactly five language choices.");
  if (searchDenseActionsShell && searchDenseActions?.accountGroups.map(({ items }) => items.length).join("/") !== "3/3/1") throw new Error("Search-dense-actions AppBar requires account command groups sized 3/3/1.");
  if (utilityIdentityShell && !utilityIdentity) throw new Error("Utility-identity AppBar requires utility, locale and account data.");
  const groupedUtilityIdentity = utilityIdentity?.groupedNavigation === true;
  const productActions = utilityIdentity?.productActions === true;
  const balancedActions = utilityIdentity?.balancedActions === true;
  const searchPersistent = Boolean(utilityIdentity?.persistentSearch);
  const invertedSearch = Boolean(utilityIdentity?.invertedSearch);
  const brandSearch = Boolean(utilityIdentity?.brandSearch);
  const contextStripControls = utilityIdentity?.contextStripControls === true;
  const contextStripActions = utilityIdentity?.contextStripActions === true;
  if (utilityIdentityShell && groupedUtilityIdentity && !productActions && !searchPersistent && !contextStripControls && (nav.destinations.length !== 3 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "4/2/3")) throw new Error("Grouped utility-identity AppBar requires exactly three disclosure parents with child counts 4/2/3.");
  if (utilityIdentityShell && groupedUtilityIdentity && !productActions && !contextStripControls && nav.destinations.some(({ href, children, badge }) => href || !children?.length || badge || children.some((child) => !child.href))) throw new Error("Grouped utility-identity AppBar requires route-free badge-free parents and linked leaves.");
  if (utilityIdentityShell && productActions && (nav.destinations.length !== 4 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "6/0/2/4")) throw new Error("Product-actions AppBar requires four mixed roots with child counts 6/0/2/4.");
  if (utilityIdentityShell && productActions && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || nav.destinations.filter(({ children }) => children?.length).some(({ href }) => href) || !nav.destinations[1]?.href || nav.destinations.some(({ badge, children }) => badge || children?.some((child) => !child.href)))) throw new Error("Product-actions AppBar requires one home identity, three disclosure-only parents, one direct root leaf, and linked child leaves.");
  if (utilityIdentityShell && balancedActions && (nav.destinations.length !== 4 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "6/0/2/4")) throw new Error("Balanced-actions AppBar requires four mixed roots with child counts 6/0/2/4.");
  if (utilityIdentityShell && balancedActions && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || nav.destinations.filter(({ children }) => children?.length).some(({ href }) => href) || !nav.destinations[1]?.href || nav.destinations.some(({ badge, children }) => badge || children?.some((child) => !child.href)))) throw new Error("Balanced-actions AppBar requires one home identity, three disclosure-only parents, one direct root leaf, and linked child leaves.");
  if (utilityIdentityShell && balancedActions && nav.destinations.flatMap(({ children = [] }) => children).filter(({ description }) => description).length !== 10) throw new Error("Balanced-actions AppBar requires exactly ten child route descriptions.");
  if (utilityIdentityShell && searchPersistent && (nav.destinations.length !== 5 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "3/6/2/7/0")) throw new Error("Search-persistent AppBar requires five mixed roots with child counts 3/6/2/7/0.");
  if (utilityIdentityShell && searchPersistent && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || nav.destinations.slice(0, 4).some(({ href }) => href) || !nav.destinations[4]?.href || nav.destinations.some(({ badge, children }) => badge || children?.some((child) => !child.href || !child.icon)))) throw new Error("Search-persistent AppBar requires one home identity, four disclosure-only parents, one direct root leaf, and eighteen linked icon leaves.");
  if (utilityIdentityShell && searchPersistent && new Set(nav.destinations.flatMap((destination) => [destination.icon, ...(destination.children ?? []).map(({ icon }) => icon)])).size !== 23) throw new Error("Search-persistent AppBar requires exactly 23 distinct semantic navigation icon seats.");
  if (utilityIdentityShell && searchPersistent && (!utilityIdentity?.persistentSearch?.label.trim() || !utilityIdentity.persistentSearch.placeholder.trim() || !utilityIdentity.persistentSearch.actionLabel.trim())) throw new Error("Search-persistent AppBar requires a labelled nonempty input and attached submit action.");
  if (utilityIdentityShell && invertedSearch && (nav.destinations.length !== 5 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "7/3/4/0/0")) throw new Error("Inverted-search AppBar requires five mixed roots with child counts 7/3/4/0/0.");
  if (utilityIdentityShell && invertedSearch && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || nav.destinations.slice(0, 3).some(({ href }) => href) || nav.destinations.slice(3).some(({ href }) => !href) || nav.destinations.some(({ badge, children }) => badge || children?.some((child) => !child.href || child.icon || child.description)))) throw new Error("Inverted-search AppBar requires one home identity, three disclosure-only parents, two direct root leaves, and fourteen unadorned linked child leaves.");
  if (utilityIdentityShell && invertedSearch && (new Set(nav.destinations.map(({ icon }) => icon)).size !== 5 || nav.destinations.some(({ icon }) => !icon))) throw new Error("Inverted-search AppBar requires exactly five distinct semantic root icons.");
  if (utilityIdentityShell && invertedSearch && (!utilityIdentity?.invertedSearch?.label.trim() || !utilityIdentity.invertedSearch.placeholder.trim() || !utilityIdentity.invertedSearch.actionLabel.trim() || utilityIdentity.searchGroups?.map(({ items }) => items.length).join("/") !== "3/2/2")) throw new Error("Inverted-search AppBar requires one labelled shared query state and application-provider ranks 3/2/2.");
  if (utilityIdentityShell && invertedSearch && (!utilityIdentity?.primaryAction?.id || !utilityIdentity?.primaryAction?.label || !utilityIdentity?.primaryAction?.actionId)) throw new Error("Inverted-search AppBar requires exactly one persistent primary action.");
  if (utilityIdentityShell && brandSearch && (nav.destinations.length !== 6 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "0/6/4/0/0/0")) throw new Error("Brand-search AppBar requires six mixed roots with child counts 0/6/4/0/0/0.");
  if (utilityIdentityShell && brandSearch && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || !nav.destinations[0]?.href || nav.destinations.slice(1, 3).some(({ href }) => href) || nav.destinations.slice(3).some(({ href }) => !href) || nav.destinations.some(({ badge, children }) => badge || children?.some((child) => !child.href || child.icon || child.description)))) throw new Error("Brand-search AppBar requires one home identity, two disclosure-only parents, four direct root leaves, and ten unadorned linked child leaves.");
  if (utilityIdentityShell && brandSearch && (new Set(nav.destinations.map(({ icon }) => icon)).size !== 6 || nav.destinations.some(({ icon }) => !icon))) throw new Error("Brand-search AppBar requires exactly six distinct semantic root icons.");
  if (utilityIdentityShell && brandSearch && (!utilityIdentity?.brandSearch?.label.trim() || !utilityIdentity.brandSearch.placeholder.trim() || !utilityIdentity.brandSearch.actionLabel.trim())) throw new Error("Brand-search AppBar requires one labelled nonempty persistent input and attached submit action.");
  if (utilityIdentityShell && contextStripControls && (nav.destinations.length !== 3 || nav.destinations.map(({ children }) => children?.length ?? 0).join("/") !== "0/6/0")) throw new Error("Context-strip-controls AppBar requires three mixed roots with child counts 0/6/0.");
  if (utilityIdentityShell && contextStripControls && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || !nav.destinations[0]?.href || nav.destinations[1]?.href || !nav.destinations[2]?.href || nav.destinations.some(({ badge, children }) => badge || children?.some((child) => !child.href || child.icon || child.description)))) throw new Error("Context-strip-controls AppBar requires one home identity, one disclosure-only parent, two direct root leaves, and six unadorned linked child leaves.");
  if (utilityIdentityShell && contextStripControls && (appBar.context.breadcrumb?.length !== 3 || appBar.context.breadcrumb.slice(0, 2).some(({ href }) => !href) || appBar.context.breadcrumb[2]?.href || appBar.context.breadcrumb[2]?.label !== nav.destinations[1]?.children?.[0]?.label)) throw new Error("Context-strip-controls AppBar requires two linked ancestors and one current nonlink matching the active child route.");
  if (utilityIdentityShell && contextStripControls && (nav.actions?.length !== 4 || nav.actions.some(({ kind, href, actionId }) => kind !== "secondary" || href || !actionId))) throw new Error("Context-strip-controls AppBar requires four ordered initially-unselected page actions.");
  if (utilityIdentityShell && contextStripActions && (nav.destinations.length !== 6 || nav.destinations.some(({ href, children, badge, icon }) => !href || children?.length || badge || !icon))) throw new Error("Context-strip-actions AppBar requires six flat linked icon destinations.");
  if (utilityIdentityShell && contextStripActions && (!nav.identity.href || !utilityIdentity?.brand?.href || nav.identity.href !== utilityIdentity.brand.href || !nav.search || !utilityIdentity.serviceSearch || nav.search.placeholder !== utilityIdentity.serviceSearch.placeholder)) throw new Error("Context-strip-actions AppBar requires one linked identity and one directly bound shared NavSearch.");
  if (utilityIdentityShell && contextStripActions && (appBar.context.breadcrumb?.length !== 3 || appBar.context.breadcrumb.slice(0, 2).some(({ href }) => !href) || appBar.context.breadcrumb[2]?.href)) throw new Error("Context-strip-actions AppBar requires two linked ancestors and one current nonlink.");
  if (utilityIdentityShell && contextStripActions && (nav.actions?.length !== 2 || nav.actions[0]?.kind !== "secondary" || nav.actions[1]?.kind !== "primary" || nav.actions.some(({ href, actionId }) => !href || actionId))) throw new Error("Context-strip-actions AppBar requires two linked page actions in secondary-primary order.");
  if (utilityIdentityShell && contextStripActions && (nav.utility?.length !== 3 || nav.utility[2]?.badge?.value !== 8 || nav.utility.some((item, index) => item.id !== utilityIdentity.utilities[index]?.id))) throw new Error("Context-strip-actions AppBar requires three directly bound NavUtility records with notification badge 8.");
  if (utilityIdentityShell && !groupedUtilityIdentity && !productActions && !balancedActions && !searchPersistent && !invertedSearch && !brandSearch && !contextStripControls && !contextStripActions && nav.destinations.length !== 4) throw new Error("Utility-identity AppBar requires exactly four flat destinations.");
  if (utilityIdentityShell && !groupedUtilityIdentity && !productActions && !balancedActions && !searchPersistent && !invertedSearch && !brandSearch && !contextStripControls && !contextStripActions && nav.destinations.some(({ children, badge }) => children?.length || badge)) throw new Error("Utility-identity AppBar requires flat badge-free destinations.");
  if (utilityIdentityShell && ((!contextStripActions && nav.search) || (!contextStripControls && !contextStripActions && nav.actions?.length) || nav.widgets?.length || (!contextStripActions && nav.utility?.length))) throw new Error("Utility-identity AppBar owns one clean navigation model without duplicate shell jobs.");
  if (utilityIdentityShell && utilityIdentity?.utilities.length !== 3) throw new Error("Utility-identity AppBar requires exactly three ordered utilities.");
  if (utilityIdentityShell && utilityIdentity?.utilities[2]?.badge?.value !== 8) throw new Error("Utility-identity notice utility requires badge value 8.");
  if (utilityIdentityShell && utilityIdentity?.languageChoices.length !== 5) throw new Error("Utility-identity AppBar requires exactly five language choices.");
  if (utilityIdentityShell && utilityIdentity?.accountGroups.map(({ items }) => items.length).join("/") !== "3/3/1") throw new Error("Utility-identity AppBar requires account command groups sized 3/3/1.");
  const densityEligible = navCollapsible && (deviceClass === "DS" || deviceClass === "DW");
  const navDensity = densityEligible ? controlledNavDensity ?? localNavDensity : "expanded";
  const setNavDensity = (next: NavDensity) => {
    if (controlledNavDensity === undefined) setLocalNavDensity(next);
    onNavDensityChange?.(next);
  };

  if (routeMinimalShell && routeMinimal) {
    return (
      <RouteMinimalAppBar
        model={routeMinimal}
        deviceClass={deviceClass}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        onBack={onBack}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </RouteMinimalAppBar>
    );
  }

  if (searchDenseActionsShell && searchDenseActions) {
    return (
      <SearchDenseActionsAppBar
        model={searchDenseActions}
        deviceClass={deviceClass}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        onBack={onBack}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </SearchDenseActionsAppBar>
    );
  }

  if (utilityIdentityShell && utilityIdentity) {
    return (
      <UtilityIdentityAppBar
        nav={nav}
        model={utilityIdentity}
        context={appBar.context}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        onBack={onBack}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </UtilityIdentityAppBar>
    );
  }

  if (commerceContextShell && commerceContext && commercePageBand) {
    return (
      <CommerceContextShell
        nav={nav}
        appBar={appBar}
        pageBand={commercePageBand}
        model={commerceContext}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </CommerceContextShell>
    );
  }

  const navigation = commerce ? (
    <CommerceTopNavigation
      model={nav}
      appBar={appBar}
      activeId={resolvedActiveId}
      deviceClass={deviceClass}
      renderIcon={renderIcon}
      renderActionIcon={renderActionIcon}
      onAction={onAction}
    />
  ) : topCommand ? (
    <TopCommandNavigation
      model={nav}
      appBar={appBar}
      activeId={resolvedActiveId}
      deviceClass={deviceClass}
      renderIcon={renderIcon}
      renderActionIcon={renderActionIcon}
      utilityMeta={navigationUtilityMeta}
      onUtilityAction={onAction}
    />
  ) : (
    <AppNavigation
      model={nav}
      activeId={resolvedActiveId}
      deviceClass={deviceClass}
      renderIcon={renderIcon}
      utilityMeta={navigationUtilityMeta}
      onUtilityAction={onAction}
      navCollapsible={densityEligible}
      navDensity={navDensity}
      onNavDensityChange={setNavDensity}
    />
  );

  if (groupedBadgesShell) {
    return (
      <GroupedBadgesNavigation
        nav={nav}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </GroupedBadgesNavigation>
    );
  }

  if (profileLedShell && profileLed) {
    return (
      <ProfileLedNavigation
        nav={nav}
        model={profileLed}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </ProfileLedNavigation>
    );
  }

  if (railMinimalActionShell && railMinimalAction) {
    return (
      <RailMinimalActionNavigation
        nav={nav}
        model={railMinimalAction}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </RailMinimalActionNavigation>
    );
  }

  if (railLabeledShell) {
    return (
      <RailLabeledNavigation
        nav={nav}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </RailLabeledNavigation>
    );
  }

  if (operationsLiveNavigation && operationsLive) {
    return (
      <OperationsLiveNavigation
        nav={nav}
        model={operationsLive}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </OperationsLiveNavigation>
    );
  }

  if (insetRecipientsNavigation && insetRecipients) {
    return (
      <InsetRecipientsNavigation nav={nav} model={insetRecipients} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>
        {children}
      </InsetRecipientsNavigation>
    );
  }

  if (dedicatedLearningPromoNavigation && learningPromoNavigation) {
    return (
      <LearningPromoNavigation nav={nav} model={learningPromoNavigation} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>
        {children}
      </LearningPromoNavigation>
    );
  }

  if (dedicatedWorkspaceTrialNavigation && workspaceTrialNavigation) {
    return (
      <WorkspaceTrialNavigation nav={nav} model={workspaceTrialNavigation} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>
        {children}
      </WorkspaceTrialNavigation>
    );
  }

  if (dedicatedAnalyticsUpsellNavigation && analyticsUpsellNavigation) {
    return (
      <AnalyticsUpsellNavigation nav={nav} model={analyticsUpsellNavigation} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>
        {children}
      </AnalyticsUpsellNavigation>
    );
  }

  if (dedicatedFilesQuotaNavigation && filesQuotaNavigation) {
    return (
      <FilesQuotaNavigation nav={nav} model={filesQuotaNavigation} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>
        {children}
      </FilesQuotaNavigation>
    );
  }

  if (dedicatedDualTierOperations && dualTierOperations) {
    return (
      <DualTierOperationsNavigation nav={nav} model={dualTierOperations} activeId={resolvedActiveId} deviceClass={deviceClass} renderIcon={renderIcon} sourceSlug={sourceSlug} sourcePreset={sourcePreset}>
        {children}
      </DualTierOperationsNavigation>
    );
  }

  if (adminTwoTierShell && adminTwoTier) {
    return (
      <AdminTwoTierShell
        nav={nav}
        model={adminTwoTier}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </AdminTwoTierShell>
    );
  }

  if (recipientShell && recipientInset) {
    return (
      <RecipientInsetShell
        nav={nav}
        appBar={appBar}
        model={recipientInset}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </RecipientInsetShell>
    );
  }

  if (workspaceTrialShell && workspaceTrial) {
    return (
      <WorkspaceTrialShell
        nav={nav}
        appBar={appBar}
        model={workspaceTrial}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </WorkspaceTrialShell>
    );
  }

  if (learningPromoShell && learningPromo) {
    return (
      <LearningPromoShell
        nav={nav}
        appBar={appBar}
        model={learningPromo}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </LearningPromoShell>
    );
  }

  if (analyticsUpsellShell && analyticsUpsell) {
    return (
      <AnalyticsUpsellShell
        nav={nav}
        appBar={appBar}
        model={analyticsUpsell}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </AnalyticsUpsellShell>
    );
  }

  if (accountLedShell && accountIdentity) {
    return (
      <AccountLedShell
        nav={nav}
        appBar={appBar}
        model={accountIdentity}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </AccountLedShell>
    );
  }

  if (filesQuotaShell && filesQuota) {
    return (
      <FilesQuotaShell
        nav={nav}
        appBar={appBar}
        model={filesQuota}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </FilesQuotaShell>
    );
  }

  if (liveOperationsShell && liveOperations) {
    return (
      <LiveOperationsShell
        nav={nav}
        appBar={appBar}
        model={liveOperations}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </LiveOperationsShell>
    );
  }

  if (labeledRailShell && labeledRail) {
    return (
      <LabeledRailShell
        nav={nav}
        appBar={appBar}
        model={labeledRail}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </LabeledRailShell>
    );
  }

  if (minimalActionRailShell && minimalActionRail) {
    return (
      <MinimalActionRailShell
        nav={nav}
        appBar={appBar}
        model={minimalActionRail}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </MinimalActionRailShell>
    );
  }

  if (compactInlineShell && compactInline) {
    return (
      <CompactInlineShell
        nav={nav}
        appBar={appBar}
        model={compactInline}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </CompactInlineShell>
    );
  }

  if (railPanelOperationsShell && railPanelOperations) {
    return (
      <RailPanelOperationsShell
        nav={nav}
        appBar={appBar}
        model={railPanelOperations}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </RailPanelOperationsShell>
    );
  }

  if (sectionTwoTierShell && sectionTwoTier) {
    return (
      <SectionTwoTierShell
        nav={nav}
        model={sectionTwoTier}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </SectionTwoTierShell>
    );
  }

  if (brandedCommandActionsShell && brandedCommandActions) {
    return (
      <BrandedCommandActionsShell
        nav={nav}
        appBar={appBar}
        model={brandedCommandActions}
        deviceClass={deviceClass}
        renderActionIcon={renderActionIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </BrandedCommandActionsShell>
    );
  }

  if (compactInlineSearchShell && compactInlineSearch) {
    return (
      <CompactInlineSearchShell
        nav={nav}
        appBar={appBar}
        model={compactInlineSearch}
        deviceClass={deviceClass}
        renderActionIcon={renderActionIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </CompactInlineSearchShell>
    );
  }

  if (greetingCommandShell && greetingCommand) {
    return (
      <GreetingCommandShell
        nav={nav}
        appBar={appBar}
        model={greetingCommand}
        deviceClass={deviceClass}
        renderActionIcon={renderActionIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </GreetingCommandShell>
    );
  }

  if (canvasGreetingShell && canvasGreeting) {
    return (
      <GreetingCommandShell
        nav={nav}
        appBar={appBar}
        model={canvasGreeting}
        canvas={canvasGreeting}
        deviceClass={deviceClass}
        renderActionIcon={renderActionIcon}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </GreetingCommandShell>
    );
  }

  if (brandTwoTierShell && brandTwoTier) {
    return (
      <BrandTwoTierShell
        nav={nav}
        appBar={appBar}
        model={brandTwoTier}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </BrandTwoTierShell>
    );
  }

  if (invertedTwoTierShell && invertedTwoTier) {
    return (
      <InvertedTwoTierShell
        nav={nav}
        appBar={appBar}
        model={invertedTwoTier}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </InvertedTwoTierShell>
    );
  }

  if (contextThreeTierShell && contextThreeTier) {
    return (
      <ContextThreeTierShell
        nav={nav}
        appBar={appBar}
        model={contextThreeTier}
        activeId={resolvedActiveId}
        deviceClass={deviceClass}
        renderIcon={renderIcon}
        renderActionIcon={renderActionIcon}
        onAction={onAction}
        sourceSlug={sourceSlug}
        sourcePreset={sourcePreset}
      >
        {children}
      </ContextThreeTierShell>
    );
  }

  return (
    <div
      className="xp-app-shell"
      data-xp-shell=""
      data-shell-family="app"
      data-device-class={deviceClass}
      data-variant={commerce ? "commerce-kpi" : topCommand ? "command-two-rank" : appShellForms[deviceClass]}
      data-shell-anatomy={commerce ? "app.top.commerce-kpi" : topCommand ? "app.top.command-two-rank" : undefined}
      data-skin={skin}
      data-nav-placement={navPlacement}
      data-has-context-strip={Boolean(appBar.contextStrip?.length && (deviceClass === "DS" || deviceClass === "DW"))}
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
      data-nav-density={navDensity}
      data-nav-collapsible={densityEligible ? "true" : "false"}
    >
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      {dedicatedTop ? navigation : <AppBar model={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} onBack={onBack} />}
      {commerce && commercePageBand ? <CommercePageBand model={commercePageBand} deviceClass={deviceClass} /> : null}
      <div className="xp-app-shell__body">
        {!dedicatedTop && !compact ? navigation : null}
        <main
          className="xp-app-shell__content xp-slot"
          id="xp-shell-content"
          tabIndex={-1}
          data-xp-region="content"
          data-xp-commerce-content-seam={commerce ? "" : undefined}
        >
          {dedicatedTop ? null : <RelocationProjection nav={nav} deviceClass={deviceClass} relocations={relocations} renderWidget={renderWidget} />}
          <div className="xp-app-shell__content-well">{children}</div>
        </main>
      </div>
      {dashboardFooterMeta && !compact ? <UtilityMeta model={dashboardFooterMeta} deviceClass={deviceClass}/> : null}
      {commerce && commercePageBand?.footerLinks ? <CommerceFooter links={commercePageBand.footerLinks} /> : null}
      <div className="xp-app-shell__bottom" data-xp-region="bottom" data-bottom-owner={!dedicatedTop && compact ? "tab-bar" : "none"}>
        {!dedicatedTop && compact ? navigation : null}
      </div>
    </div>
  );
}
