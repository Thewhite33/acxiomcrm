# AcxiomCRM — Business Presentation & Product Demonstration Guide

A role-based Customer Relationship Management (CRM) platform designed to streamline the complete sales lifecycle: from lead capture, qualification, and customer conversion to opportunity forecasting, follow-up scheduling, and enterprise audit compliance.

---

## 1. Quick Demo Credentials

Log in using the seed accounts below to showcase each perspective:

| Role | Email | Password | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Sales Executive** | `john@acxiom.com` | `Sales@123` | Managing assigned leads, converting qualified prospects, closing opportunities, and scheduling daily follow-ups. |
| **Sales Manager** | `manager@acxiom.com` | `Manager@123` | Monitoring team-wide pipeline, sales velocity, executive performance, and team conversion metrics. |
| **Administrator** | `admin@acxiom.com` | `Admin@123` | Complete system governance, staff management, account unlocking, and tamper-resistant security audit tracking. |

---

## 2. Core Business Workflows

### The Complete Revenue Lifecycle

```
[ New Inbound Lead ]
       │
       ▼
[ Executive Assignment & Outreach ] (Status: Contacted)
       │
       ▼
[ Qualification Review ] ──────────► [ Unqualified / Lost ]
       │ (Status: Qualified)
       ▼
[ One-Click Conversion ] ──────────► Automatically creates Customer Master Record
       │
       ▼
[ Opportunity Creation ] ──────────► Set Deal Amount, Close Date & Win Probability %
       │
       ▼
[ Pipeline Progression ] ──────────► Qualification ➔ Proposal ➔ Negotiation ➔ Closed Won
       │
       ▼
[ Follow-Up & Activity Logs ] ─────► Scheduled Calls, Client Meetings & Audit Trail
```

---

## 3. Role-by-Role Feature & Walkthrough Guide

### A. Sales Executive Role (`john@acxiom.com`)

The Sales Executive workspace is focused on execution, deal hygiene, and task prioritization. All records displayed are scoped to what is assigned to them.

#### 1. Landing & Navigation
- **Public Landing Page**: Clean, modern interface highlighting key platform capabilities with quick access to Sign In and Registration.
- **Role Scoping**: Navigation automatically adapts to hide administrative settings (Users, Security Logs) so the executive can focus entirely on sales tasks.

#### 2. Executive Dashboard
- **Total Customers**: Count of active client accounts owned by this executive.
- **Open Leads**: Active prospective buyers that require outreach or qualification.
- **Open Opportunities**: Active deals currently moving through pipeline stages.
- **Pending Follow-Ups**: Calls, emails, or meetings scheduled for today and the near future.
- **Total Pipeline Value**: Aggregate dollar amount of active opportunities owned by the representative.
- **Visual Breakdowns**:
  - *Lead Status Breakdown*: Visual progress bars illustrating where prospects are in the qualification funnel (`New`, `Contacted`, `Qualified`, etc.).
  - *Pipeline Stage Breakdown*: Number of deals and dollar value across stages (`Qualification`, `Proposal`, `Negotiation`, `Won`, `Lost`).

#### 3. Lead Management & Qualification
- **Capturing Leads**: Enter prospect name, email, phone, company, source (Website, Referral, Trade Show), and expected deal size.
- **Input Validation**: Automatic checking prevents invalid email formats, phone length errors, or negative expected values.
- **Status Lifecycle**:
  - `New`: Newly captured prospect awaiting first touch.
  - `Contacted`: Outreach has occurred (call made or email sent).
  - `Qualified`: The prospect has verified budget, authority, need, and timeline.
  - `Unqualified`: Not a fit for current service offerings.
  - `Lost`: Chose a competitor or cancelled initiative.

#### 4. The "Lead-to-Customer" Milestone
- When a lead reaches `QUALIFIED`, a dedicated **"Convert to Customer"** button activates on the lead's detail page.
- With one click:
  1. A new official **Customer Master Record** is created with all contact info pre-filled.
  2. The lead status transitions to `CONVERTED`.
  3. The permanent relationship link is maintained for historic tracking.
  4. An automated entry is written to the system audit trail.

#### 5. Opportunity Management & Weighted Forecasting
- **Creating Deals**: Tie deals directly to established customers.
- **Deal Validation Rules**:
  - Amount must be greater than $0.
  - Probability must be between 0% and 100%.
  - Expected Close Date **cannot be in the past** for active opportunities.
- **Weighted Pipeline Value Calculation**:
  $$\text{Weighted Value} = \frac{\text{Deal Amount} \times \text{Win Probability}}{100}$$
  *Example*: A $100,000 deal at 60% probability yields a weighted forecast of **$60,000**.
- **Stage Progression**: Move deals from `Qualification` $\rightarrow$ `Proposal` $\rightarrow$ `Negotiation` $\rightarrow$ `Won` or `Lost`.

#### 6. Follow-Up & Activity Management
- **Smart Scheduling**: Plan calls, meetings, demos, and emails. Planned dates cannot be set to yesterday or past dates.
- **Categorization Views**:
  - `All`: Complete history of planned and past touchpoints.
  - `Upcoming`: Upcoming agenda items (today or future).
  - `Overdue`: Red-flagged follow-ups that were planned for an earlier date but not marked complete.
- **Activity Logging**: Log completed ad-hoc calls, meeting minutes, and emails with customers or leads.

---

### B. Sales Manager Role (`manager@acxiom.com`)

The Sales Manager workspace is designed for operational visibility, team quota monitoring, and strategic pipeline forecasting.

#### 1. Manager Dashboard
- Provides a comprehensive view across all team members and assigned territories.
- Displays total department leads, active team pipeline volume, and winning vs. losing trends.

#### 2. Pipeline Performance Report (`/reports/pipeline`)
- **Stage Distribution**: Shows the total deal volume and dollar amount currently sitting in each pipeline stage.
- **Owner Distribution**: Displays revenue breakdown by sales representative, helping identify high-performing executives and those needing deal coaching.
- **Financial Summary Cards**:
  - *Total Pipeline Value*: All open revenue currently on the table.
  - *Weighted Value*: Probability-adjusted realistic forecast for executive leadership.
  - *Won Revenue*: Total booked revenue closed across the team.
  - *Lost Revenue*: Deals lost, highlighting areas for sales training.
- **1-Click Excel Download**: Instantly export the complete dataset with deal values, probabilities, weighted calculations, and close dates.

#### 3. Complete Reports & Analytics Suite (All with Native Excel Export)
The CRM includes 7 purpose-built analytical reports equipped with real-time Excel (`.xlsx`) export buttons:
1. **Customer Directory Report** (`/reports/customers`): Accounts, statuses, company affiliations, and assigned ownership.
2. **Lead Acquisition Report** (`/reports/leads`): Tracking inbound leads by source channel, priority level, and qualification status.
3. **Follow-Up Action Report** (`/reports/followups`): Planned tasks, overdue communications, and completed engagements.
4. **Opportunity Forecast Report** (`/reports/opportunities`): Active pipeline stages, forecasted closure dates, and win/loss records.
5. **Pipeline Velocity Report** (`/reports/pipeline`): Stage-wise deal distribution, owner performance, and probability-weighted value.
6. **Lead Conversion Analytics** (`/reports/conversion`): Conversion rates (resolved and overall), transition velocity, and generated accounts.
7. **User Engagement Report** (`/reports/activity`): Employee productivity metrics covering logged calls, meetings, emails, and completed tasks.

#### 4. Team Oversight
- Managers have full access to view, edit, and reassign customers, leads, and deals across executives to rebalance workload.

---

### C. Administrator Role (`admin@acxiom.com`)

The Administrator workspace provides enterprise governance, access administration, and auditability.

#### 1. User & Role Management (`/users`)
- **Account Creation**: Onboard new staff members and assign their system role (`Admin`, `Manager`, or `Sales Executive`).
- **Enforced Password Security Policy**:
  - Minimum 8 characters.
  - Must include at least one uppercase letter, one lowercase letter, and one number.
  - Passwords are encrypted using adaptive salt rounds with bcrypt before storage; plain text is never stored.
- **Account Lockout Protection**:
  - If a user fails to enter the correct password 5 consecutive times, the account is automatically locked to prevent brute-force attacks.
- **Account Unlocking & Deactivation**:
  - Administrators can toggle an employee's active status or unlock a locked account with a single checkbox.

#### 2. Security & Compliance Audit Trail (`/audit`)
- An append-only log capturing every critical event across the enterprise:
  - `LOGIN_SUCCESS`: Authenticated sign-in timestamps.
  - `LOGIN_FAILURE`: Invalid credential attempts and lockout triggers.
  - `CREATE`: New customers, leads, and opportunities created.
  - `UPDATE`: Changes to customer records, deal values, and stages.
  - `CONVERT`: Lead-to-customer transitions.
  - `ROLE_CHANGE`: Modifications to staff permissions.
- **Filtering Tools**: Filter audit history by Module (`AUTH`, `CUSTOMER`, `LEAD`, `OPPORTUNITY`, `USER`), Action, or specific Record ID.

---

## 4. Suggested 5-Minute Live Presentation Script

Use this step-by-step sequence to deliver a clear demonstration to evaluators or stakeholders:

### Act 1: The Inbound Customer Journey (Sales Executive Perspective)
1. **Sign In**: Log in as `john@acxiom.com` with password `Sales@123`.
2. **Dashboard Review**: Highlight the 8 real-time KPI cards and the pipeline distribution chart.
3. **Capture a Lead**: Navigate to **Leads** $\rightarrow$ Click **New Lead**.
   - Input: Name: *"Tech Horizons"*, Email: *"contact@techhorizons.com"*, Source: *"Website"*, Expected Value: *$50,000*.
   - Mention the client-side validation format checks.
4. **Lead Lifecycle**:
   - Open the lead detail page.
   - Edit the status from `NEW` to `CONTACTED`, then to `QUALIFIED`.
5. **The Conversion**:
   - Point out the **"Convert to Customer"** button that activates once qualified.
   - Click the button: Show how the lead instantly creates an official **Customer** record while linking history.

### Act 2: Revenue Pipeline & Follow-Ups
1. **Create an Opportunity**:
   - Navigate to **Opportunities** $\rightarrow$ Click **New Opportunity**.
   - Select the newly converted customer.
   - Set Amount: *$50,000*, Probability: *70%*, Stage: *Proposal*.
   - Highlight the **Derived Weighted Pipeline**: It automatically computes **$35,000**.
   - Attempt to set an Expected Close Date in the past to demonstrate business rule enforcement.
2. **Schedule Follow-Up**:
   - Link a Follow-Up meeting for next week.
   - Show the **Upcoming** vs **Overdue** tabs under Follow-Ups.

### Act 3: Strategic Analytics (Sales Manager Perspective)
1. **Switch User**: Sign out and log in as `manager@acxiom.com` (`Manager@123`).
2. **Review Department Metrics**: Show how the manager sees the aggregated team view.
3. **Pipeline Reports**:
   - Open **Reports** $\rightarrow$ **Pipeline Report**.
   - Walk through the stage-wise revenue bars and executive quota breakdown.

### Act 4: Enterprise Security & Governance (Admin Perspective)
1. **Switch User**: Sign out and log in as `admin@acxiom.com` (`Admin@123`).
2. **User Administration**:
   - Navigate to **Users & Roles**.
   - Point out the security status indicators: Active state, Lockout flags, and Role permissions.
3. **Audit Trail Inspection**:
   - Navigate to **Audit Logs**.
   - Filter by `Module: LEAD` or `Action: CONVERT`.
   - Point to the audit log created during Act 1, showing user name, action, timestamp, and record identifier.
4. **Conclusion**: Emphasize how the application fulfills complete role-based segregation, validation, workflow logic, and database integrity.

---

## 5. Metrics & Glossary Reference

- **Weighted Pipeline Value**: Calculated as $\text{Amount} \times \text{Probability} / 100$. Allows finance and sales leadership to forecast cash flow based on realistic closing probabilities rather than raw deal values.
- **Lead Statuses**:
  - `New`: Uncontacted inquiry.
  - `Contacted`: Introductory communication underway.
  - `Qualified`: Meets target profile, ready for proposal/customer conversion.
  - `Unqualified`: Does not meet buying criteria.
  - `Converted`: Promoted to formal Customer account.
  - `Lost`: Prospective buyer went cold or disengaged.
- **Opportunity Stages**:
  - `Qualification` (Typical win probability: 10%–20%)
  - `Proposal` (Typical win probability: 40%–60%)
  - `Negotiation` (Typical win probability: 70%–90%)
  - `Won` (100% — Revenue recognized)
  - `Lost` (0% — Deal terminated)
