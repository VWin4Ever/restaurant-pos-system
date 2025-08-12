# Restaurant POS System - Mermaid DFD Diagrams

## Overview
This document contains Mermaid code for both Level 0 (Context Diagram) and Level 1 Data Flow Diagrams for the Restaurant POS System. You can render these diagrams in any markdown editor that supports Mermaid (GitHub, GitLab, Notion, etc.).

---

## Level 0 DFD (Context Diagram)

```mermaid
graph TB
    %% External Entities
    subgraph "EXTERNAL ENTITIES"
        CASHIERS[Cashiers<br/>• Process Orders<br/>• Handle Cash<br/>• Print Receipts<br/>• Manage Tables<br/>• View Reports]
        ADMINS[Admins<br/>• User Management<br/>• Inventory Control<br/>• System Settings<br/>• Reports<br/>• Product Management]
    end

    %% Central System
    subgraph "RESTAURANT POS SYSTEM"
        POS[Restaurant POS System<br/>• Order Processing<br/>• Inventory Management<br/>• Table Management<br/>• Reporting<br/>• User Management<br/>• Settings]
    end

    %% Data Flows from External Entities to System
    CASHIERS -->|Order requests, Payment info,<br/>Table updates, Receipt requests,<br/>Report requests| POS
    ADMINS -->|User mgmt, Inventory adjustments,<br/>Settings, Report requests,<br/>Product mgmt| POS

    %% Data Flows from System to External Entities
    POS -->|Order confirmations, Receipts,<br/>Table status, Real-time notifications,<br/>Reports| CASHIERS
    POS -->|User accounts, Inventory reports,<br/>Configurations, Comprehensive reports,<br/>Product data| ADMINS

    %% Styling
    classDef externalEntity fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef system fill:#f3e5f5,stroke:#4a148c,stroke-width:3px
    classDef dataFlow fill:#fff3e0,stroke:#e65100,stroke-width:1px

    class CASHIERS,ADMINS externalEntity
    class POS system
```

---

## Level 1 DFD (Major Processes)

```mermaid
graph TB
    %% External Entities
    subgraph "EXTERNAL ENTITIES"
        CASHIERS[Cashiers<br/>• Process Orders<br/>• Handle Cash<br/>• Manage Tables<br/>• View Reports]
        ADMINS[Admins<br/>• User Management<br/>• Inventory Control<br/>• System Settings<br/>• Product Management<br/>• Reports]
    end

    %% Major Processes
    subgraph "MAJOR PROCESSES"
        AUTH[1.0 User Authentication<br/>• Login/Logout<br/>• Role Check<br/>• Permissions<br/>• User Management]
        
        ORDER[2.0 Order Management<br/>• Create Order<br/>• Modify Order<br/>• Process Order<br/>• Payment Processing]
        
        INVENTORY[3.0 Inventory Management<br/>• Track Stock<br/>• Adjust Stock<br/>• Stock Alerts<br/>• Stock Logs]
        
        TABLE[4.0 Table Management<br/>• Table Status<br/>• Reservations<br/>• Capacity Management<br/>• Maintenance]
        
        PRODUCT[5.0 Product Management<br/>• Product CRUD<br/>• Category Management<br/>• Price Management<br/>• Image Upload]
        
        REPORTING[6.0 Reporting System<br/>• Sales Reports<br/>• Inventory Reports<br/>• Financial Reports<br/>• Staff Reports]
        
        SETTINGS[7.0 Settings Management<br/>• System Configuration<br/>• Business Rules<br/>• Tax Settings<br/>• Security Settings]
        
        REALTIME[8.0 Real-Time Updates<br/>• WebSocket<br/>• Live Updates<br/>• Notifications<br/>• Data Sync]
    end

    %% Data Stores
    subgraph "DATA STORES"
        D1[D1: Users<br/>• User accounts<br/>• Roles<br/>• Permissions<br/>• Auth tokens]
        
        D2[D2: Orders<br/>• Order records<br/>• Order items<br/>• Payment info<br/>• Status]
        
        D3[D3: Products<br/>• Product info<br/>• Categories<br/>• Prices<br/>• Images]
        
        D4[D4: Stock<br/>• Stock levels<br/>• Stock logs<br/>• Alerts<br/>• Min levels]
        
        D5[D5: Tables<br/>• Table info<br/>• Status<br/>• Capacity<br/>• Reservations]
        
        D6[D6: Settings<br/>• System config<br/>• Business rules<br/>• Tax settings<br/>• Security set]
        
        D7[D7: Reports<br/>• Report data<br/>• Analytics<br/>• Metrics<br/>• Historical]
        
        D8[D8: Logs<br/>• Activity logs<br/>• Error logs<br/>• Audit trails<br/>• Performance]
    end

    %% External Entity to Process Flows
    CASHIERS --> ORDER
    CASHIERS --> TABLE
    CASHIERS --> AUTH
    CASHIERS --> REPORTING
    
    ADMINS --> AUTH
    ADMINS --> INVENTORY
    ADMINS --> SETTINGS
    ADMINS --> REPORTING
    ADMINS --> PRODUCT

    %% Process to Data Store Flows
    AUTH <--> D1
    ORDER <--> D2
    ORDER <--> D3
    ORDER <--> D5
    INVENTORY <--> D4
    INVENTORY <--> D3
    TABLE <--> D5
    PRODUCT <--> D3
    REPORTING <--> D7
    REPORTING <--> D2
    REPORTING <--> D4
    REPORTING <--> D1
    SETTINGS <--> D6
    REALTIME <--> D1
    REALTIME <--> D2
    REALTIME <--> D3
    REALTIME <--> D4
    REALTIME <--> D5
    REALTIME <--> D6
    REALTIME <--> D7
    REALTIME <--> D8

    %% Inter-Process Flows
    AUTH --> ORDER
    ORDER --> INVENTORY
    ORDER --> TABLE
    PRODUCT --> INVENTORY
    REPORTING --> REALTIME
    SETTINGS --> REALTIME
    REALTIME --> AUTH
    REALTIME --> ORDER
    REALTIME --> INVENTORY
    REALTIME --> TABLE
    REALTIME --> PRODUCT
    REALTIME --> REPORTING
    REALTIME --> SETTINGS

    %% Styling
    classDef externalEntity fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef dataStore fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class CASHIERS,ADMINS externalEntity
    class AUTH,ORDER,INVENTORY,TABLE,PRODUCT,REPORTING,SETTINGS,REALTIME process
    class D1,D2,D3,D4,D5,D6,D7,D8 dataStore
```

---

## Detailed Process Flow Diagram

```mermaid
flowchart TD
    %% Start
    START([Customer Places Order]) --> CASHIER[Cashier Enters Order]
    
    %% Authentication
    CASHIER --> AUTH{User Authenticated?}
    AUTH -->|No| LOGIN[Login Required]
    LOGIN --> AUTH
    AUTH -->|Yes| VALIDATE[Validate Order]
    
    %% Order Processing
    VALIDATE --> CHECK_STOCK{Stock Available?}
    CHECK_STOCK -->|No| LOW_STOCK[Low Stock Alert]
    CHECK_STOCK -->|Yes| CREATE_ORDER[Create Order]
    
    CREATE_ORDER --> UPDATE_TABLE[Update Table Status]
    UPDATE_TABLE --> DEDUCT_STOCK[Deduct Stock]
    DEDUCT_STOCK --> SEND_KITCHEN[Send to Kitchen]
    
    %% Kitchen Processing
    SEND_KITCHEN --> KITCHEN[Kitchen Processes Order]
    KITCHEN --> UPDATE_STATUS[Update Order Status]
    UPDATE_STATUS --> NOTIFY[Real-time Notification]
    
    %% Payment Processing
    NOTIFY --> PAYMENT[Process Payment]
    PAYMENT --> GENERATE_RECEIPT[Generate Receipt]
    GENERATE_RECEIPT --> UPDATE_TABLE_FINAL[Update Table Status]
    
    %% Reporting
    UPDATE_TABLE_FINAL --> LOG_ACTIVITY[Log Activity]
    LOG_ACTIVITY --> UPDATE_REPORTS[Update Reports]
    UPDATE_REPORTS --> END([Order Complete])
    
    %% Error Handling
    LOW_STOCK --> NOTIFY_ADMIN[Notify Admin]
    NOTIFY_ADMIN --> END
    
    %% Styling
    classDef startEnd fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef decision fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef action fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class START,END startEnd
    class CASHIER,CREATE_ORDER,UPDATE_TABLE,DEDUCT_STOCK,SEND_KITCHEN,KITCHEN,UPDATE_STATUS,PAYMENT,GENERATE_RECEIPT,UPDATE_TABLE_FINAL,LOG_ACTIVITY,UPDATE_REPORTS process
    class AUTH,CHECK_STOCK decision
    class LOGIN,VALIDATE,LOW_STOCK,NOTIFY,NOTIFY_ADMIN action
```

---

## System Architecture Diagram

```mermaid
graph TB
    %% Frontend Layer
    subgraph "FRONTEND LAYER"
        REACT[React.js Frontend<br/>• Dashboard<br/>• Orders<br/>• Products<br/>• Tables<br/>• Reports<br/>• Settings]
    end
    
    %% Backend Layer
    subgraph "BACKEND LAYER"
        API[REST API<br/>• Express.js<br/>• JWT Auth<br/>• File Upload<br/>• Security]
        WS[WebSocket Server<br/>• Real-time Updates<br/>• Live Notifications<br/>• Data Sync]
    end
    
    %% Database Layer
    subgraph "DATABASE LAYER"
        MYSQL[MySQL Database<br/>• Users<br/>• Orders<br/>• Products<br/>• Stock<br/>• Tables<br/>• Settings]
        PRISMA[Prisma ORM<br/>• Data Access<br/>• Migrations<br/>• Schema Management]
    end
    
    %% External Services
    subgraph "EXTERNAL SERVICES"
        NETLIFY[Netlify<br/>Frontend Hosting]
        RAILWAY[Railway<br/>Backend Hosting<br/>Database Hosting]
    end
    
    %% Connections
    REACT <--> API
    REACT <--> WS
    API <--> PRISMA
    WS <--> PRISMA
    PRISMA <--> MYSQL
    REACT --> NETLIFY
    API --> RAILWAY
    MYSQL --> RAILWAY
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class REACT frontend
    class API,WS backend
    class MYSQL,PRISMA database
    class NETLIFY,RAILWAY external
```

---

## How to Use These Diagrams

### **1. GitHub/GitLab**
Simply paste the Mermaid code blocks into your markdown files. GitHub and GitLab automatically render Mermaid diagrams.

### **2. Notion**
Use the Mermaid code with Notion's code block feature (select Mermaid as the language).

### **3. Documentation Tools**
- **Docusaurus**: Supports Mermaid out of the box
- **VuePress**: With mermaid plugin
- **GitBook**: Native Mermaid support

### **4. Online Mermaid Editor**
Visit [mermaid.live](https://mermaid.live) to:
- Paste the code and see live preview
- Export as PNG, SVG, or PDF
- Customize colors and styling

### **5. VS Code**
Install the "Mermaid Preview" extension to view diagrams directly in your editor.

---

## Customization Options

You can customize these diagrams by:

1. **Changing Colors**: Modify the `fill` and `stroke` values in the `classDef` sections
2. **Adding More Details**: Include additional processes or data stores
3. **Modifying Layout**: Change `graph TB` (top-bottom) to `graph LR` (left-right) or `graph TD` (top-down)
4. **Adding Icons**: Use emoji or special characters for visual enhancement

These Mermaid diagrams provide a professional, interactive way to visualize your Restaurant POS System's data flow and architecture!
