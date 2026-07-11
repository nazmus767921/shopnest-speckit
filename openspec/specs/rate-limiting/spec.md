## ADDED Requirements

### Requirement: Checkout Rate Limiting
The system SHALL limit the number of checkout requests (`submitAddress`, `submitPayment`) per IP address to prevent spam.

#### Scenario: Checkout spam prevention
- **WHEN** a single IP address attempts more than 5 checkout submissions within a 60-second sliding window
- **THEN** the system rejects the request and returns an error message.

### Requirement: OTP Rate Limiting
The system SHALL limit the number of OTP verification requests per phone number.

#### Scenario: OTP abuse prevention
- **WHEN** more than 3 OTP requests are made for the same phone number within 10 minutes
- **THEN** the system rejects the request and returns an error message.

### Requirement: Product API Rate Limiting
The system SHALL limit product creation and updates per merchant to prevent API abuse.

#### Scenario: Bulk product creation limits
- **WHEN** a merchant attempts more than 30 product mutations within a 60-second window
- **THEN** the system rejects the request and returns an error message.
