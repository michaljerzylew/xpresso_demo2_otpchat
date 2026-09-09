"use client";

import { useDeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { PricingAction, PricingFeature, PricingPlan, ResolvedPricingFixture } from "./pricing-model";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Action({ action }: { action: PricingAction }) {
  return <a className="xp-pricing__action" href={action.href} data-emphasis={action.emphasis} data-action-id={action.id} data-xp-control>{action.label}</a>;
}

function PlanIcon({ iconKey }: { iconKey: string }) {
  const shapes: Record<string, string> = {
    sprout: "M12 21V10m0 0C8 10 5 7 5 3c4 0 7 3 7 7Zm0 3c4 0 7-3 7-7-4 0-7 3-7 7Z",
    bloom: "M12 22v-7m0 0c-5 0-8-3-8-8 5 0 8 3 8 8Zm0 0c5 0 8-3 8-8-5 0-8 3-8 8Z",
    loader: "M3 16h12l4-5h2v7H3v-2Zm3 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm11 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    excavator: "M3 16h9l3-5 5 1v6H3v-2Zm4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    crane: "M5 21V4h12M8 7h11l-3-3m0 0v13",
    orbit: "M12 4a8 4 25 1 0 0 16 8 4 25 1 0 0-16Zm0 0a4 8-25 1 0 0 16 4 8-25 1 0 0-16Z",
    signal: "M4 18a11 11 0 0 1 16 0M7 15a7 7 0 0 1 10 0m-7 0a3 3 0 0 1 4 0m-2 4h.01",
    "remote-diagnostic": "M3 5h18v12H3V5Zm6 16h6m-3-4v4m-6-9h3l2-4 3 7 2-3h2",
    "repair-box": "M4 8h16v12H4V8Zm4 0V5h8v3m-7 6h6m-3-3v6",
    "field-technician": "M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6 18v-5a6 6 0 0 1 12 0v5m1-10 2 2-4 4",
    "shield-scan": "M12 3 20 6v5c0 5-3 9-8 11-5-2-8-6-8-11V6l8-3Zm-4 8h8m-6 4h4",
    "shield-active": "M12 3 20 6v5c0 5-3 9-8 11-5-2-8-6-8-11V6l8-3Zm-4 9 3 3 5-6",
    "radar-search": "M12 12 19 5m-7 7a7 7 0 1 0 7 7m-7-3a4 4 0 1 1 4-4",
    "network-lock": "M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v11H6V10Zm6 4v3",
  };
  return <svg className="xp-pricing__icon" viewBox="0 0 24 24" aria-hidden="true" data-system-key={iconKey}><path d={shapes[iconKey] ?? "M4 4h16v16H4z"}/></svg>;
}

function Feature({ feature }: { feature: PricingFeature }) {
  const state = feature.availability ?? "included";
  return <li data-feature-id={feature.id} data-availability={state}><span aria-hidden="true">{state === "excluded" ? "−" : state === "limited" ? "◐" : "✓"}</span><span><strong>{feature.label}</strong>{feature.description ? <small>{feature.description}</small> : null}</span></li>;
}

function Price({ plan, billing }: { plan: PricingPlan; billing: string }) {
  const price = plan.priceByBilling[billing] ?? Object.values(plan.priceByBilling)[0];
  return <p className="xp-pricing__price" data-price-plan={plan.id}><strong>{money.format(price.amount)}</strong><span>/{price.cadence}</span></p>;
}

function PaymentMark({ name, markKey }: { name: string; markKey: string }) {
  return <span className="xp-pricing__payment" data-system-key={markKey}><i aria-hidden="true">{name.slice(0, 2).toUpperCase()}</i><span>{name}</span></span>;
}

function PlanCard({ plan, billing, selected, networks, onSelect, band = false, showAction = true }: { plan: PricingPlan; billing: string; selected: boolean; networks?: ResolvedPricingFixture["paymentNetworks"]; onSelect: () => void; band?: boolean; showAction?: boolean }) {
  return <article className="xp-pricing__plan" data-plan-id={plan.id} data-selected={selected} data-recommended={plan.badge?.tone === "recommended" || undefined} data-band={band || undefined}>
    <header>{plan.iconKey ? <PlanIcon iconKey={plan.iconKey}/> : null}<div><h3>{plan.name}</h3><p>{plan.description}</p></div>{plan.badge ? <span className="xp-pricing__badge" data-tone={plan.badge.tone}>{plan.badge.label}</span> : null}</header>
    <Price plan={plan} billing={billing}/>
    {plan.userSummary ? <p className="xp-pricing__summary">{plan.userSummary}</p> : null}
    {plan.features.length ? <ul className="xp-pricing__features">{plan.features.map((feature) => <Feature feature={feature} key={feature.id}/>)}</ul> : null}
    {plan.featureGroups?.length ? <div className="xp-pricing__groups">{plan.featureGroups.map((group) => <section key={group.id} data-group-id={group.id}><h4>{group.label}</h4><ul>{group.features.map((feature) => <Feature feature={feature} key={feature.id}/>)}</ul></section>)}</div> : null}
    {networks?.length ? <div className="xp-pricing__payments" aria-label="Accepted payment networks">{networks.map((network) => <PaymentMark {...network} key={network.id}/>)}</div> : null}
    {showAction ? <Action action={plan.action}/> : null}
    <button className="xp-pricing__select" type="button" aria-pressed={selected} onClick={onSelect} data-xp-control>{selected ? "Selected plan" : `Compare ${plan.name}`}</button>
  </article>;
}

function Matrix({ model, selectedPlanId }: { model: ResolvedPricingFixture; selectedPlanId: string }) {
  if (!model.comparison?.rows.length) return model.comparison?.action ? <div className="xp-pricing__comparison-link"><Action action={model.comparison.action}/></div> : null;
  return <section className="xp-pricing__matrix" data-xp-feature-matrix aria-labelledby={`${model.sourceKey}-matrix-title`}><h3 id={`${model.sourceKey}-matrix-title`}>{model.comparison.title}</h3>{model.comparison.description ? <p>{model.comparison.description}</p> : null}<div className="xp-pricing__matrix-scroll"><table><thead><tr><th scope="col">Capability</th>{model.plans.map((plan) => <th scope="col" data-selected={plan.id === selectedPlanId} key={plan.id}>{plan.name}</th>)}</tr></thead><tbody>{model.comparison.rows.map((row) => <tr data-matrix-row={row.id} key={row.id}><th scope="row">{row.label}</th>{model.plans.map((plan) => { const value = row.values[plan.id]; return <td data-selected={plan.id === selectedPlanId} key={plan.id}><span className="xp-visually-hidden">{plan.name}: </span>{value === true ? "Included" : value === false ? "Not included" : value}</td>; })}</tr>)}</tbody></table></div>{model.comparison.action ? <Action action={model.comparison.action}/> : null}</section>;
}

function AccordionPlan({ plan, billing, selected, hasRank, onSelect, onKeyDown }: { plan: PricingPlan; billing: string; selected: boolean; hasRank: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  return <section className="xp-pricing__accordion-row" data-expanded={selected || undefined} data-recommended={plan.badge?.tone === "recommended" || undefined}>
    <button type="button" role={hasRank ? "tab" : undefined} aria-selected={hasRank ? selected : undefined} aria-expanded={selected} onClick={onSelect} onKeyDown={onKeyDown} data-plan-tab={hasRank ? plan.id : undefined} data-xp-control>
      <span>{plan.name}</span>{plan.badge ? <span className="xp-pricing__badge" data-tone={plan.badge.tone}>{plan.badge.label}</span> : null}<span aria-hidden="true">{selected ? "⌃" : "⌄"}</span>
    </button>
    {selected ? <article className="xp-pricing__accordion-detail" data-plan-id={plan.id}>
      <p>{plan.description}</p><Price plan={plan} billing={billing}/><Action action={plan.action}/>
    </article> : null}
  </section>;
}

export function PlanPicker({ model }: { model: ResolvedPricingFixture }) {
  const deviceClass = useDeviceClass();
  const root = useRef<HTMLElement>(null);
  const [slotWidth, setSlotWidth] = useState<number>();
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = () => setSlotWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const compact = deviceClass === "M" || deviceClass === "TP" || (slotWidth !== undefined && slotWidth < 544);
  const [selectedPlanId, setSelectedPlanId] = useState(model.initialPlanId);
  const [billing, setBilling] = useState(model.billing?.initialOptionId ?? Object.keys(model.plans[0].priceByBilling)[0]);
  const selected = useMemo(() => model.plans.find((plan) => plan.id === selectedPlanId) ?? model.plans[0], [model.plans, selectedPlanId]);
  const singleOwner = compact || model.appearance === "plan-selector" || model.appearance === "plan-accordion";
  const visiblePlans = singleOwner ? [selected] : model.plans;
  const moveSelection = (event: KeyboardEvent<HTMLButtonElement>, planId: string) => {
    const current = model.plans.findIndex((plan) => plan.id === planId);
    const last = model.plans.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowRight" || event.key === "ArrowDown" ? (current + 1) % model.plans.length : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (current - 1 + model.plans.length) % model.plans.length : -1;
    if (next < 0) return;
    event.preventDefault();
    setSelectedPlanId(model.plans[next].id);
    const nextButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next];
    nextButton?.focus();
    nextButton?.scrollIntoView({ block: "nearest", inline: "center" });
  };
  if (model.appearance === "plan-accordion") return <section ref={root} className="xp-pricing xp-pricing--accordion" data-xp-pricing-renderer data-source-key={model.sourceKey} data-appearance={model.appearance} data-device-class={deviceClass} data-slot-compact={compact || undefined} aria-labelledby={`${model.sourceKey}-title`}>
    <div className="xp-pricing__accordion-layout">
      <div className="xp-pricing__accordion-intro">
        <header className="xp-pricing__header"><div>{model.eyebrow ? <p>{model.eyebrow}</p> : null}<h2 id={`${model.sourceKey}-title`}>{model.title}</h2>{model.description ? <p>{model.description}</p> : null}</div></header>
        {model.billing ? <fieldset className="xp-pricing__billing"><legend>Billing period</legend>{model.billing.options.map((option) => <label key={option.id}><input type="radio" name={`${model.sourceKey}-billing`} value={option.id} checked={billing === option.id} onChange={() => setBilling(option.id)}/><span>{option.label}{option.savingsLabel ? <small>{option.savingsLabel}</small> : null}</span></label>)}</fieldset> : null}
        <div className="xp-pricing__accordion-proof">{model.reassurance?.length ? <ul className="xp-pricing__reassurance">{model.reassurance.map((item) => <li key={item}>{item}</li>)}</ul> : null}<Matrix model={model} selectedPlanId={selectedPlanId}/></div>
      </div>
      <div className="xp-pricing__accordion-rows" role={model.plans.length > 1 ? "tablist" : undefined} aria-label={model.plans.length > 1 ? "Plans" : undefined}>{model.plans.map((plan) => <AccordionPlan plan={plan} billing={billing} selected={plan.id === selectedPlanId} hasRank={model.plans.length > 1} onSelect={() => setSelectedPlanId(plan.id)} onKeyDown={(event) => moveSelection(event, plan.id)} key={plan.id}/>)}</div>
    </div>
  </section>;
  return <section ref={root} className="xp-pricing" data-xp-pricing-renderer data-source-key={model.sourceKey} data-appearance={model.appearance} data-device-class={deviceClass} data-slot-compact={compact || undefined} data-decor={model.decor} aria-labelledby={`${model.sourceKey}-title`}>
    <header className="xp-pricing__header"><div>{model.eyebrow ? <p>{model.eyebrow}</p> : null}<h2 id={`${model.sourceKey}-title`}>{model.title}</h2>{model.description ? <p>{model.description}</p> : null}</div>{model.socialProof ? <div className="xp-pricing__social"><div>{model.socialProof.people.map((person) => { const asset = model.resolvedMedia.find((item) => item.key === person.avatarKey); return asset?.src ? <img src={asset.src} alt={person.alt} data-person-id={person.id} key={person.id}/> : null; })}</div><p><strong>{model.socialProof.rating} / {model.socialProof.maximum}</strong><span>{model.socialProof.reviewCount.toLocaleString("en-US")} reviews</span></p></div> : null}</header>
    {model.billing ? <fieldset className="xp-pricing__billing"><legend>Billing period</legend>{model.billing.options.map((option) => <label key={option.id}><input type="radio" name={`${model.sourceKey}-billing`} value={option.id} checked={billing === option.id} onChange={() => setBilling(option.id)}/><span>{option.label}{option.savingsLabel ? <small>{option.savingsLabel}</small> : null}</span></label>)}</fieldset> : null}
    {model.plans.length > 1 ? <div className="xp-pricing__rank" role="tablist" aria-label="Plans">{model.plans.map((plan) => <button type="button" role="tab" aria-selected={plan.id === selectedPlanId} aria-expanded={model.appearance === "plan-accordion" ? plan.id === selectedPlanId : undefined} onClick={() => setSelectedPlanId(plan.id)} onKeyDown={(event) => moveSelection(event, plan.id)} data-plan-tab={plan.id} data-xp-control key={plan.id}>{plan.iconKey ? <PlanIcon iconKey={plan.iconKey}/> : null}<span>{plan.name}</span></button>)}</div> : null}
    <div className="xp-pricing__layout">
      {model.supportingBenefits?.length ? <aside className="xp-pricing__benefits"><h3>What is included</h3><ul>{model.supportingBenefits.map((feature) => <Feature feature={feature} key={feature.id}/>)}</ul></aside> : null}
      <div className="xp-pricing__plans" data-count={visiblePlans.length}>{visiblePlans.map((plan) => <PlanCard plan={plan} billing={billing} selected={plan.id === selectedPlanId} networks={model.paymentNetworks} onSelect={() => setSelectedPlanId(plan.id)} band={model.appearance === "plan-bands"} showAction={model.sourceKey !== "pricing-component-10"} key={plan.id}/>)}</div>
    </div>
    {model.sourceKey === "pricing-component-10" ? <div className="xp-pricing__contact"><Action action={selected.action}/></div> : null}
    {model.reassurance?.length ? <ul className="xp-pricing__reassurance">{model.reassurance.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    <Matrix model={model} selectedPlanId={selectedPlanId}/>
    {model.contactAction ? <div className="xp-pricing__contact"><Action action={model.contactAction}/></div> : null}
  </section>;
}
