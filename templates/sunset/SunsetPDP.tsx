import React from "react"
import { PDPProps } from "../types"

export function SunsetPDP({ product }: PDPProps) {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
      <p className="text-xl">BDT {product.pricePaisa / 100}</p>
      <div className="mt-8">{product.description}</div>
    </div>
  )
}
