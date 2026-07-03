
- What if the admin deletes a product that has pending orders? 

- what if the customer verify the otp on checkout and does not place order or payment
  - current: the order is created as pending_payment and never deleted 
  - what should happen: the order should be deleted 

- what if super admin changes the current subcription tier plan for a merchant who has active subscription
  - should it activate instantly or on next billing cycle?
  - if instantly then what should happen to the current products, collections, discounts count? should they be reset or just disabled or something else?
  - what if merchant has already paid for multiple month like growth plan for 3 month. and currently running month is 1. and the super admin chages the growth plan product limit from 100 to 50. so how does it affect the merchants remaining month? how should we handle this cases? should we refund or the they get the old limit till their bough subscription or should we upgrade to the highest tier ?