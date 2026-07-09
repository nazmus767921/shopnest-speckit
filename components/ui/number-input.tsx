'use client'

import * as React from 'react'
import { Button, Group, Input, NumberField } from 'react-aria-components'
import { MinusIcon, PlusIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NumberInputProps {
  value?: number
  onChange?: (value: number) => void
  minValue?: number
  maxValue?: number
  className?: string
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  error?: boolean
  leftIcon?: React.ReactNode
  variant?: 'default' | 'compact'
}

export function NumberInput({
  value,
  onChange,
  minValue = 0,
  maxValue,
  className,
  placeholder,
  disabled,
  id,
  name,
  onBlur,
  onKeyDown,
  error,
  leftIcon,
  variant = 'default'
}: NumberInputProps) {
  const isCompact = variant === 'compact'

  return (
    <NumberField
      value={value}
      onChange={onChange}
      minValue={minValue}
      maxValue={maxValue}
      isDisabled={disabled}
      className={cn('w-full', className)}
    >
      <Group className={cn(
        isCompact
          ? 'border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex h-8 w-full min-w-0 items-center overflow-hidden rounded-lg border bg-transparent text-base whitespace-nowrap transition-colors outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-3 md:text-sm'
          : 'border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex h-10 w-full min-w-0 items-center overflow-hidden rounded-lg border bg-transparent text-base whitespace-nowrap transition-colors outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-3 md:text-sm',
        error && 'border-destructive ring-destructive/20 dark:ring-destructive/40'
      )}>
        {leftIcon && (
          <span className="text-muted-foreground pl-3 pr-1 select-none flex items-center justify-center font-medium">
            {leftIcon}
          </span>
        )}
        <Input
          id={id}
          name={name}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'selection:bg-primary selection:text-primary-foreground w-full grow outline-none bg-transparent tabular-nums',
            isCompact
              ? cn('py-1 text-center', leftIcon ? 'pl-1 pr-2.5' : 'px-2.5')
              : cn('py-1.5 text-left', leftIcon ? 'pl-1 pr-3' : 'px-3')
          )}
        />
        {isCompact ? (
          <div className='flex h-[calc(100%+2px)] flex-col shrink-0'>
            <Button
              slot='increment'
              className='border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -me-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <ChevronUp className='size-3' />
              <span className='sr-only'>Increment</span>
            </Button>
            <Button
              slot='decrement'
              className='border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -me-px -mt-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <ChevronDown className='size-3' />
              <span className='sr-only'>Decrement</span>
            </Button>
          </div>
        ) : (
          <>
            <Button
              slot='decrement'
              className='border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <MinusIcon className='size-4' />
              <span className='sr-only'>Decrement</span>
            </Button>
            <Button
              slot='increment'
              className='border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center rounded-r-lg border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <PlusIcon className='size-4' />
              <span className='sr-only'>Increment</span>
            </Button>
          </>
        )}
      </Group>
    </NumberField>
  )
}

export default NumberInput
