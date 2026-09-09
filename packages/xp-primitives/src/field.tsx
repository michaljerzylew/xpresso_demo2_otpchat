"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { RadioGroup } from "radix-ui";

type FieldContextValue = { id: string; helpId?: string; errorId?: string; invalid: boolean };
const FieldContext = createContext<FieldContextValue | null>(null);

type FieldProperties = HTMLAttributes<HTMLDivElement> & {
  id?: string;
  invalid?: boolean;
  hasHelp?: boolean;
  hasError?: boolean;
};

function FieldRoot({ id: providedId, invalid = false, hasHelp, hasError, className, ...properties }: FieldProperties) {
  const generatedId = useId();
  const id = providedId ?? `xp-field-${generatedId.replaceAll(":", "")}`;
  const context = {
    id,
    helpId: hasHelp ? `${id}-help` : undefined,
    errorId: hasError ? `${id}-error` : undefined,
    invalid,
  };
  return (
    <FieldContext.Provider value={context}>
      <div
        {...properties}
        className={["xp-field", className].filter(Boolean).join(" ")}
        data-invalid={invalid ? "true" : undefined}
        data-xp-primitive="field-group"
      />
    </FieldContext.Provider>
  );
}
function useField() {
  const context = useContext(FieldContext);
  if (!context) throw new Error("Field compound components must be inside Field.");
  return context;
}

function FieldLabel({ className, ...properties }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { id } = useField();
  return <label {...properties} htmlFor={id} className={["xp-field__label", className].filter(Boolean).join(" ")} />;
}

type FieldInputProperties = Omit<InputHTMLAttributes<HTMLInputElement>, "inputMode" | "enterKeyHint" | "autoComplete"> & {
  inputMode: NonNullable<InputHTMLAttributes<HTMLInputElement>["inputMode"]>;
  enterKeyHint: NonNullable<InputHTMLAttributes<HTMLInputElement>["enterKeyHint"]>;
  autoComplete: string;
};

const FieldInput = forwardRef<HTMLInputElement, FieldInputProperties>(function FieldInput({ className, ...properties }, ref) {
  const { id, helpId, errorId, invalid } = useField();
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <input
      ref={ref}
      {...properties}
      id={id}
      className={["xp-field-control", "xp-field__input", className].filter(Boolean).join(" ")}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      data-xp-control
    />
  );
});

type NativeSelectProperties = SelectHTMLAttributes<HTMLSelectElement> & { autoComplete: string };
function NativeSelect({ className, ...properties }: NativeSelectProperties) {
  const { id, helpId, errorId, invalid } = useField();
  return (
    <select
      {...properties}
      id={id}
      className={["xp-field-control", "xp-field__select", className].filter(Boolean).join(" ")}
      aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={invalid || undefined}
      data-xp-control
    />
  );
}

function FieldTextarea({ className, ...properties }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, helpId, errorId, invalid } = useField();
  return (
    <textarea
      {...properties}
      id={id}
      className={["xp-field-control", "xp-field__textarea", className].filter(Boolean).join(" ")}
      aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={invalid || undefined}
      data-xp-control
    />
  );
}

function FieldHelp({ className, ...properties }: HTMLAttributes<HTMLParagraphElement>) {
  const { helpId } = useField();
  return <p {...properties} id={helpId} className={["xp-field__help", className].filter(Boolean).join(" ")} />;
}

function FieldError({ className, ...properties }: HTMLAttributes<HTMLParagraphElement>) {
  const { errorId } = useField();
  return <p {...properties} id={errorId} className={["xp-field__error", className].filter(Boolean).join(" ")} role="alert" />;
}

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Input: FieldInput,
  Select: NativeSelect,
  Textarea: FieldTextarea,
  Help: FieldHelp,
  Error: FieldError,
});

export function FieldGroup({ className, ...properties }: FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return <fieldset {...properties} className={["xp-field-group", className].filter(Boolean).join(" ")} data-xp-primitive="field-group" />;
}

export function SectionedForm({ className, ...properties }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form {...properties} className={["xp-sectioned-form", className].filter(Boolean).join(" ")} />;
}

export type ChoiceItem = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  media?: ReactNode;
  details?: ReactNode[];
  disabled?: boolean;
};

type ChoiceSetProperties = {
  label: string;
  items: ChoiceItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function ChoiceSet({ label, items, value, defaultValue, onChange }: ChoiceSetProperties) {
  return (
    <RadioGroup.Root
      className="xp-choice-set"
      aria-label={label}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      data-xp-primitive="field-group"
    >
      {items.map((item) => (
        <RadioGroup.Item className="xp-choice" value={item.value} disabled={item.disabled} data-xp-control key={item.value}>
          <span className="xp-choice__indicator" aria-hidden="true" />
          {item.media ? <span className="xp-choice__media">{item.media}</span> : null}
          <span className="xp-choice__copy">
            <strong>{item.label}</strong>
            {item.description ? <span>{item.description}</span> : null}
            {item.meta ? <em>{item.meta}</em> : null}
            {item.details?.length ? <ul>{item.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul> : null}
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
