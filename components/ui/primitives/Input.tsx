"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, leftIcon, rightIcon, onFocus, onBlur, onChange, value, defaultValue, ...props }, ref) => {
    const localRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => localRef.current as HTMLInputElement)

    if (type === "number") {
      const stringifyValue = (val: any) => {
        if (val === null || val === undefined) return ""
        return String(val)
      }

      const [localValue, setLocalValue] = React.useState<string>(
        value !== undefined
          ? stringifyValue(value)
          : defaultValue !== undefined
          ? stringifyValue(defaultValue)
          : ""
      )

      const typedValueRef = React.useRef<string>(
        value !== undefined
          ? stringifyValue(value)
          : defaultValue !== undefined
          ? stringifyValue(defaultValue)
          : ""
      )

      const isFocusedRef = React.useRef<boolean>(false)

      React.useEffect(() => {
        if (value !== undefined) {
          const incomingStr = stringifyValue(value)
          // If the input is currently focused, the user's last typed/cleared value is empty,
          // and the incoming value is 0, we do NOT override local value with "0".
          if (
            isFocusedRef.current &&
            typedValueRef.current === "" &&
            value === 0
          ) {
            return
          }
          typedValueRef.current = incomingStr
          setLocalValue(incomingStr)
        }
      }, [value])

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        typedValueRef.current = e.target.value
        setLocalValue(e.target.value)
        if (onChange) {
          onChange(e)
        }
      }

      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = true
        if (onFocus) {
          onFocus(e)
        }
      }

      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = false
        if (onBlur) {
          onBlur(e)
        }
      }

      const handleStep = (direction: "increment" | "decrement") => {
        const inputEl = localRef.current
        if (!inputEl) return

        const currentValue = parseFloat(inputEl.value) || 0
        const step = parseFloat(inputEl.getAttribute("step") || "1")
        const minAttr = inputEl.getAttribute("min")
        const maxAttr = inputEl.getAttribute("max")
        const min = minAttr !== null ? parseFloat(minAttr) : -Infinity
        const max = maxAttr !== null ? parseFloat(maxAttr) : Infinity

        let nextValue = currentValue
        if (direction === "increment") {
          nextValue = currentValue + step
        } else {
          nextValue = currentValue - step
        }

        if (nextValue < min) nextValue = min
        if (nextValue > max) nextValue = max

        const stepDecimalPlaces = (step.toString().split(".")[1] || "").length
        const formattedValue = nextValue.toFixed(stepDecimalPlaces)

        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
        if (nativeSetter) {
          nativeSetter.call(inputEl, formattedValue)
          typedValueRef.current = formattedValue
          setLocalValue(formattedValue)
          inputEl.dispatchEvent(new Event("change", { bubbles: true }))
          inputEl.dispatchEvent(new Event("input", { bubbles: true }))
        } else {
          inputEl.value = formattedValue
          typedValueRef.current = formattedValue
          setLocalValue(formattedValue)
        }
      }

      // Tap-and-hold / Click-and-hold stepper logic
      const timerRef = React.useRef<any>(null)
      const intervalRef = React.useRef<any>(null)

      const stopStepping = React.useCallback(() => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }, [])

      const startStepping = React.useCallback((direction: "increment" | "decrement") => {
        stopStepping()
        handleStep(direction)

        timerRef.current = setTimeout(() => {
          intervalRef.current = setInterval(() => {
            handleStep(direction)
          }, 80)
        }, 400)
      }, [handleStep, stopStepping])

      React.useEffect(() => {
        return () => stopStepping()
      }, [stopStepping])

      return (
        <div
          className={cn(
            "relative flex items-stretch w-full bg-canvas-light rounded-md border border-hairline-light min-h-11 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-canvas-light",
            {
              "border-red-500 focus-within:ring-red-500": error,
              "cursor-not-allowed opacity-50": props.disabled,
            },
            className
          )}
        >
          {leftIcon && (
            <div className="flex items-center justify-center pl-3.5 text-shade-40 shrink-0 select-none">
              {leftIcon}
            </div>
          )}
          <input
            type="number"
            className={cn(
              "flex-1 bg-transparent text-ink font-sans text-body-md py-2.5 min-h-11 w-full focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              {
                "pl-1.5": leftIcon,
                "pl-3": !leftIcon,
                "pr-1.5": rightIcon,
                "pr-3": !rightIcon,
              }
            )}
            ref={localRef}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            defaultValue={defaultValue}
            {...(value !== undefined ? { value: localValue } : {})}
            {...props}
          />
          {rightIcon && (
            <div className="flex items-center justify-center pr-3 text-shade-40 shrink-0 select-none">
              {rightIcon}
            </div>
          )}
          <div className="flex flex-col border-s border-hairline-light w-8 divide-y divide-hairline-light shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={() => startStepping("increment")}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              onTouchStart={(e) => {
                e.preventDefault()
                startStepping("increment")
              }}
              onTouchEnd={stopStepping}
              onTouchCancel={stopStepping}
              disabled={props.disabled || props.readOnly}
              className="flex items-center justify-center flex-1 text-shade-50 hover:bg-canvas-cream hover:text-ink active:bg-shade-30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={() => startStepping("decrement")}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              onTouchStart={(e) => {
                e.preventDefault()
                startStepping("decrement")
              }}
              onTouchEnd={stopStepping}
              onTouchCancel={stopStepping}
              disabled={props.disabled || props.readOnly}
              className="flex items-center justify-center flex-1 text-shade-50 hover:bg-canvas-cream hover:text-ink active:bg-shade-30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )
    }

    if (leftIcon || rightIcon) {
      return (
        <div className={cn("relative flex items-center w-full", className)}>
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-shade-40 pointer-events-none select-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full bg-canvas-light text-ink font-sans text-body-md rounded-md border border-hairline-light px-3 py-2.5 min-h-11 transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-shade-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-light disabled:cursor-not-allowed disabled:opacity-50",
              {
                "border-red-500 focus-visible:ring-red-500": error,
                "pl-10": leftIcon,
                "pr-10": rightIcon,
              }
            )}
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-shade-40 pointer-events-none select-none">
              {rightIcon}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex w-full bg-canvas-light text-ink font-sans text-body-md rounded-md border border-hairline-light px-3 py-2.5 min-h-11 transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-shade-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-light disabled:cursor-not-allowed disabled:opacity-50",
          {
            "border-red-500 focus-visible:ring-red-500": error,
          },
          className
        )}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
