"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TrialCountdownBannerProps {
  trialExpiryDate: Date | string | null
}

export function TrialCountdownBanner({ trialExpiryDate }: TrialCountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  const [isMounted, setIsMounted] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    if (!trialExpiryDate) return

    const expiryTime = new Date(trialExpiryDate).getTime()

    const calculateTimeLeft = () => {
      const now = Date.now()
      const difference = expiryTime - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    }

    calculateTimeLeft() // initial call
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [trialExpiryDate])

  if (!isMounted || !trialExpiryDate || isExpired) return null

  // If there are less than 48 hours left, it becomes a "destructive" urgent banner
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 48

  const formatDigit = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className={cn(
      "w-full rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border",
      isUrgent 
        ? "bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-400" 
        : "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-400"
    )}>
      {/* Messaging */}
      <div className="flex flex-col gap-1.5 flex-1 text-center md:text-left">
        <h3 className="font-bold text-lg leading-tight flex items-center justify-center md:justify-start gap-2">
          <span>Don’t lose your progress—your trial ends soon.</span>
        </h3>
        <p className={cn(
          "text-sm leading-relaxed opacity-90 max-w-3xl",
          isUrgent ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
        )}>
          Your free trial is expiring, but your work doesn't have to. Upgrade to a paid plan now to keep your projects, data, and workflows running without interruption.
        </p>
      </div>

      {/* Countdown Clock and CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
        
        {/* Animated Digital Clock */}
        <div className="flex items-center gap-2 select-none" aria-label="Countdown timer">
          <TimeBlock value={timeLeft.days} label="Days" isUrgent={isUrgent} />
          <span className="text-xl font-bold opacity-50 pb-4">:</span>
          <TimeBlock value={timeLeft.hours} label="Hrs" isUrgent={isUrgent} />
          <span className="text-xl font-bold opacity-50 pb-4">:</span>
          <TimeBlock value={timeLeft.minutes} label="Min" isUrgent={isUrgent} />
          <span className="text-xl font-bold opacity-50 pb-4">:</span>
          <TimeBlock value={timeLeft.seconds} label="Sec" isUrgent={isUrgent} />
        </div>

        {/* CTA Button */}
        <Button 
          asChild 
          className={cn(
            "font-bold px-8 shadow-sm",
            isUrgent 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-amber-600 hover:bg-amber-700 text-white"
          )}
        >
          <Link href="/dashboard/billing">
            {isUrgent ? "Keep My Plan" : "Upgrade Plan"}
          </Link>
        </Button>
      </div>
    </div>
  )
}

function TimeBlock({ value, label, isUrgent }: { value: number, label: string, isUrgent: boolean }) {
  const formattedValue = value.toString().padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-1 w-12">
      <div className={cn(
        "w-full h-12 flex items-center justify-center rounded-lg font-mono text-xl font-bold border shadow-xs tracking-wider",
        isUrgent 
          ? "bg-red-100 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100" 
          : "bg-amber-100 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100"
      )}>
        {formattedValue}
      </div>
      <span className={cn(
        "text-[10px] uppercase font-bold tracking-widest opacity-70",
        isUrgent ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
      )}>
        {label}
      </span>
    </div>
  )
}
