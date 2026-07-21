import React from "react"
import { type PDPProps } from "../types"

export function MidnightPDP({ product }: PDPProps) {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
      <p className="text-xl">BDT {product.pricePaisa / 100}</p>
      <div className="mt-8">{product.description}</div>
    </div>
  )
}
