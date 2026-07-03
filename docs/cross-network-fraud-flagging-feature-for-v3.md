# Product Requirements Document (PRD): Cross-Network Fraud Flagging

---

### 1. Objective and Scope

* 
**Objective:** To implement an automated fraud detection network that aggregates consumer cancellation and return history across all platform tenants, protecting merchants from logistics losses.


* 
**Scope:** This feature spans the Supabase PostgreSQL database layer for cross-network querying, the Next.js consumer storefront for conditional checkout blocking, and the Merchant Admin Portal for risk visualization.



### 2. Problem Statement

* In the Bangladeshi e-commerce and F-Commerce landscape, a high Cash on Delivery (COD) return/cancellation rate is a major drain on profit.


* When a customer fakes an order or refuses delivery at their doorstep, the merchant loses money on forward-and-return courier shipping fees.



### 3. Core Functional Requirements

**3.1. The Checkout Check (Real-Time Query)**

* When a consumer inputs their phone number at checkout, the Next.js application executes a fast Drizzle select statement.


* The system must run an indexed SQL query scanning the order history across all stores on the platform based on that phone number.



**3.2. Conditional COD Automation**

* The system must allow merchants to utilize a Conditional COD Toggle tied directly to the fraud network score.


* If a consumer's phone number enters the High Risk bracket, the Next.js checkout system must dynamically adjust the interface.


* Instead of allowing standard Cash on Delivery, the checkout flow blocks the order placement.


* The interface must trigger a message prompting an advance payment of the delivery charge (e.g., 60/120/150 BDT) via bKash/Nagad to secure the order before it is placed.


* This filters out non-serious buyers completely before the merchant ever packs a box or books a courier consignment.



**3.3. Admin Portal Risk Visualization**

* The dashboard should immediately render a color-coded security status next to the buyer's phone number when an order rolls in or is manually created.


* **Risk Tiers:**
* 🟢 Low Risk: 0–1 cancellations across the network.


* 🟡 Medium Risk: 2–3 delivery rejections.


* 🔴 High Risk / Fake Order Alert: 4+ cancellations across the platform network.





**3.4. The Financial Impact Tracker**

* The dashboard must include a micro-widget that calculates "Estimated Courier Loss Saved.".


* Every time a merchant cancels a high-risk order based on the platform's flag, it logs that they saved ~150 BDT in return delivery fees.



---

### 4. Technical Architecture & Database Schema

**4.1. Data Workflow**

* Because the stack utilizes Supabase (PostgreSQL) + Drizzle ORM, aggregating cross-store history runs in microseconds as a simple indexed relational database query.


* PostgreSQL processes this mathematically at the database layer, returning the global cancellation score across all tenants instantly without lagging the frontend or compromising database isolation.



**4.2. Database Requirements**

* 
**The Global Orders Table:** Store all orders from all subdomains/custom domains inside a single unified PostgreSQL table.


* 
**Security:** Ensure the table is securely isolated for individual merchant visibility using row-level security parameters where appropriate.


* 
**The Optimization Hook:** A composite database index must be built on the `customer_phone` and `order_status` columns to ensure instantaneous cross-network scanning.



---

### 5. Success Metrics

* 
**ROI Validation:** Track the Financial Impact Tracker widget; once a merchant's tracker crosses 1,000 BDT, the software has completely paid for itself that month.


* 
**Merchant Retention:** Monitor if positioning the platform as a collaborative shield where merchants protect each other from fake buyers successfully decreases churn rates.