# Sector Assignments

## Assignment Rules

- Each candidate has one owning research agent only.
- Sector ownership is determined by the problem owner's primary operating sector, not by the solution category.
- If a candidate fits multiple sectors, assign it to the agent whose primary sector best matches the problem owner's core business.
- If ownership is still unclear, the coordinator assigns the candidate before deeper research continues.
- Source-language rule for all agents: English only.

## Research Agent A

- Primary sectors: manufacturing, industrial operations, wholesale distribution, logistics, warehousing, freight
- Geography focus: UK, Ireland, Germany, Netherlands, Nordics
- Good fits: factory operations, supply-chain bottlenecks, warehouse digitization, fulfillment issues, industrial quality/compliance workflows
- Avoid overlaps with: retail storefront operations, hospitality venues, food-service operators, healthcare providers, education providers, general professional-services firms

## Research Agent B

- Primary sectors: retail, ecommerce, hospitality, travel, restaurants, food and beverage operators
- Geography focus: United States, Canada, Australia, New Zealand
- Good fits: multi-location retail operations, guest experience operations, restaurant back-of-house workflows, inventory and demand planning, frontline staff coordination
- Avoid overlaps with: industrial manufacturing/logistics firms, hospitals and clinics, schools and training providers, legal/accounting/consulting firms

## Research Agent C

- Primary sectors: healthcare delivery, health services, education, training, professional services, business services
- Geography focus: United Kingdom, Ireland, Singapore, India, South Africa
- Good fits: clinic administration, care coordination, student or learner operations, scheduling and compliance work, client-service delivery, back-office professional workflows
- Avoid overlaps with: manufacturing/distribution/logistics, retail storefronts, hospitality operators, restaurants, consumer packaged-goods operators unless the SME's core business is service delivery

## Duplicate-Prevention Handoff Rules

- Before opening sources, an agent claims the candidate in `tracking-sheet.csv` with organization name, website, sector, country, and duplicate-check key.
- The duplicate-check key is `normalized organization name + root domain`.
- If two agents surface the same organization, the first recorded claim keeps ownership unless the coordinator reassigns it.
- Mixed-sector candidates follow the primary-sector rule; non-owning agents mark them as `referred`, not `in progress`.
- Agents should check the tracker before claiming a new organization and again before handing off their Phase 1 CSV.
