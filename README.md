# Coupon Management API

> An Express + SQLite assignment that creates rule-based coupons, finds the best coupon for a user and cart, and tracks per-user usage.

**[Watch the demo](https://drive.google.com/file/d/1sCfaXzlHHWeB5Jyt0SMKfAYaAyWRQY6N/view?usp=sharing)** · **[Open the deployed coupon list](https://anshumat-foundation-assignment-production.up.railway.app/api/coupons)**

```mermaid
flowchart LR
    A[Admin creates coupon] --> DB[(SQLite)]
    U[User + cart] --> E[Eligibility engine]
    DB --> E
    E --> R[Rank eligible coupons]
    R --> B[Best coupon]
    B --> T[Record usage]
    T --> DB
```

## What it does

```mermaid
flowchart TB
    API((Coupon API))
    API --> C[Create<br/>coupon + rules]
    API --> L[List<br/>all coupons]
    API --> F[Filter<br/>date, usage, user, cart]
    API --> D[Calculate<br/>flat or percent discount]
    API --> R[Rank<br/>discount → expiry → code]
    API --> U[Track<br/>usage per user]
```

## Documentation map

| Guide | Visual focus |
|---|---|
| [Architecture](docs/architecture.md) | Layers, modules, request path, and repository map |
| [Coupon selection](docs/coupon-selection.md) | Eligibility pipeline, discount formulas, and tie-breaks |
| [API and data](docs/api-and-data.md) | Endpoints, payloads, schema, and relationships |
| [Setup and verification](docs/setup-and-verification.md) | Local run, curl checks, Railway, and troubleshooting |
| [What I learned](docs/what-i-learned.md) | Design lessons, limitations, and production hardening |

```mermaid
flowchart LR
    R[README] --> A[Architecture]
    R --> S[Selection logic]
    R --> D[API + data]
    R --> V[Setup + checks]
    R --> L[Learning]
```

## API at a glance

Base path: `/api`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/createCoupon` | Create a coupon and its eligibility rules |
| `GET` | `/coupons` | List coupons with user/cart rule rows |
| `POST` | `/bestCoupons` | Return the highest-value eligible coupon |
| `POST` | `/increment-usage` | Increment one user–coupon usage counter |

```mermaid
sequenceDiagram
    actor Client
    participant API as Express API
    participant Rules as Selection engine
    participant DB as SQLite

    Client->>API: POST /api/bestCoupons
    API->>DB: Read coupons and rules
    DB-->>Rules: Coupon candidates
    Rules->>Rules: Filter + calculate + rank
    Rules-->>Client: bestCoupon or null
    Client->>API: POST /api/increment-usage
    API->>DB: Upsert usage count
    API-->>Client: Success
```

> [!IMPORTANT]
> Finding a coupon does **not** reserve or consume it. The client must call `/increment-usage` separately after the coupon is actually used.

## Selection order

```mermaid
flowchart LR
    A[All coupons] --> B[Active date]
    B --> C[Usage available]
    C --> D[User eligible]
    D --> E[Cart eligible]
    E --> F[Calculate discount]
    F --> G[Highest discount]
    G --> H[Earliest expiry]
    H --> I[Alphabetical code]
```

## Data model

```mermaid
erDiagram
    coupons ||--|| coupon_user_attributes : has
    coupons ||--|| coupon_cart_attributes : has
    coupons ||--o{ user_coupon_usage : records

    coupons {
      integer id PK
      text code UK
      text discountType
      real discountValue
      text startDate
      text endDate
      integer usageLimitPerUser
    }
    coupon_user_attributes {
      integer coupon_id FK
      text allowedUserTiers
      real minLifetimeSpend
      integer minOrdersPlaced
      integer firstOrderOnly
      text allowedCountries
    }
    coupon_cart_attributes {
      integer coupon_id FK
      real minCartValue
      text applicableCategories
      text excludedCategories
      integer minItemsCount
    }
    user_coupon_usage {
      integer coupon_id FK
      text user_id
      integer timesUsed
    }
```

## Stack

```mermaid
flowchart LR
    JS[JavaScript<br/>ES modules] --> N[Node.js 22]
    N --> E[Express 5]
    E --> S[better-sqlite3]
    S --> DB[(database.db)]
    E --> R[Railway]
```

## Quick start

```bash
git clone https://github.com/SidheshwarSarangal/Anshumat-Foundation-Assignment.git
cd Anshumat-Foundation-Assignment
npm install
npm run dev
```

The API starts at `http://localhost:3000` unless `PORT` is set. `database.db` is created automatically; use `DB_FILE` to choose another path.

```bash
curl http://localhost:3000/api/coupons
```

See [Setup and verification](docs/setup-and-verification.md) for complete request examples.

## Current boundaries

| Implemented | Not currently implemented |
|---|---|
| Rule-based coupon creation | Authentication or admin authorization |
| Date, usage, user, and cart checks | Schema-validation library |
| Flat and capped-percent discounts | Transaction joining selection with redemption |
| Deterministic best-coupon ranking | Automated test suite |
| SQLite persistence | Durable Railway volume by default |

<details>
<summary><strong>Complete system view</strong></summary>

```mermaid
flowchart TB
    Client[API client]

    subgraph HTTP[Express server]
        JSON[express.json]
        Router[/api router]
    end

    subgraph Controllers[Coupon controllers]
        Create[createCoupon]
        List[getAllCoupons]
        Best[getBestCoupon]
        Usage[incrementCouponUsage]
    end

    subgraph Storage[SQLite database.db]
        Coupons[(coupons)]
        UserRules[(coupon_user_attributes)]
        CartRules[(coupon_cart_attributes)]
        UsageRows[(user_coupon_usage)]
    end

    Client --> JSON --> Router
    Router --> Create
    Router --> List
    Router --> Best
    Router --> Usage
    Create --> Coupons
    Create --> UserRules
    Create --> CartRules
    List --> Coupons
    List --> UserRules
    List --> CartRules
    Best --> Coupons
    Best --> UserRules
    Best --> CartRules
    Best --> UsageRows
    Usage --> UsageRows
```

</details>
