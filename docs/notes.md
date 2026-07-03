# Overview
This Notes are only for the v1


# 19-subscriion-plan-changes
<!-- ## Thoughts -->

## ISSUES
- [x] currently if I update an existing plan the merchant does not get the updated plan immediately until their next purchase? we should make a system to update all the merchants who are using the plan immediately after updating the plan. I think this is because of cache component. need to invalidate on update.
- [x] plans/edit page submit button has issues. if i change and save the update it works fine. but if i go to the edit page of the same plan again i see the saving button is disabled and still spinning. until i refresh the page.
- [x] The business logic is working fine. If super admin decrease the limit of a current merchant plan. the merchants limits are pulled from the merchants subcription buying time limit. which is intended. but thee /dashboard/billing page is showing only the updated plan limits. which is confusing. we should also show the original limit of the plan and the updated limit of the plan. so that the merchant can see the difference.
- [x] Discount page is not aligned with the new subscription plans and limits. maybe its hardcoded. Need fixes.

## Feature
- [x] Plan compare feature for the merchants. So that they can compare the plans and choose the best plan for them. Like if they are on starter plan and want to upgrade to pro then they can compare the plans and choose the best plan for them. And also show the diff between the plans. Like what they will get if they upgrade to pro plan and what they will lose if they downgrade from pro plan to starter plan.
- [ ] FEAT: scenario: admin gets a toggle in the edit plan page whether to update the merchant's current plan limits merchant who are using this plan immidiately. If admin enables the toggle then the merchant's current plan limits will be updated immidiately.


---


# Issues & Improvements
- [x] Improve : In the telegram settings if the user paste chat id and click "save & Send a Test message" button without staring a chat with the bot the bot never sends a message to the user. so, i this case we should open a modal with istructions to force user to start a chat with the bot first and send a message to the bot.   

---

# Notes

### Merchants Directory
- [x] Feat: Implement filter tabs based on subscription plans and Status.

---


### Subscription Managment 
- Should introduce a middle ground plan which has better benefits than starter plan but less than growth plan. like 100 products, 500 orders, 5000 collections. name it Pro. Price should be around 999tk.
- The Growth plan should be renamed to Pro and the old Pro plan should be renamed to Growth. (this is just a thought).

---

## Merchant Dashboard

### Discount
- The discount should have a validate option. like minimum 200tk purchase required for this discount. max usage count. this discount is only applicable for specific products.

### Categories
- The Category should have subcategories like in the shopify.

## Storefront
### Checkout
- The city should be selectable instead of text input. with a combobox. and the seller should select the delivery charge based on the city. and delivery charge should be in the checkout page before placing the order. 

---

## APP WIDE

- if filters has no value or count zero then it should be disabled to save db requests

- Give a refresh button to every page to get the updated data. like order list, product list, collection list, discount list, review list, etc. And the refresh button should be in the top of the right corner.

- The server side search inputs should have a clear button. Like if i search for a product and then click the clear button, it should clear the search and show the updated data. (order page, product page, collection page, discount page, review page)

---

# FEATURE TODO
- Media library and Management for merchants. like add folders, add images in folder, move images between folders, delete images, etc. upload and delete in bulk. rename folder and image name. Search Image etc. 

---

<!-- # ISSUES  -->


---

## IMPORTANT BUILD PLAN
### 17. Subscription Tiers Expansion & Advanced Discounts
* **What it builds:** Refactors the entire subscription limits engine across server actions and DB queries to enforce the new 3-tier model: Starter, Growth, and Pro. Updates `(dashboard)/billing` UI to reflect these changes. Extends the `discount_codes` schema and CRUD forms to include "Minimum Purchase Amount" and "Applicable Products" constraints, and enforces these rules during checkout calculation.
* **Dependencies:** Unit 16 (Advanced Checkout), Unit 12 (Subscriptions).



## IMPORTANT QUESTIONS
- Should we use redis for caching?



<!-- ## PERFORMANCE ISSUES -->