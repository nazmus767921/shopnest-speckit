import React from "react"
import type { TemplateModule } from "../types"

export const HomePage: TemplateModule["HomePage"] = () => React.createElement("div", null, "General Home Page")
export const PLP: TemplateModule["PLP"] = () => React.createElement("div", null, "General Product Listing Page")
export const PDP: TemplateModule["PDP"] = () => React.createElement("div", null, "General Product Detail Page")
export const CartPage: TemplateModule["CartPage"] = () => React.createElement("div", null, "General Cart Page")
export const Navbar: TemplateModule["Navbar"] = () => React.createElement("div", null, "General Navbar")
export const Footer: TemplateModule["Footer"] = () => React.createElement("div", null, "General Footer")
