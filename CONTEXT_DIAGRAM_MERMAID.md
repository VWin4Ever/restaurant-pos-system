# DINE-IN Restaurant POS System - Context Diagram (Mermaid)

## Level 0 DFD (Context Diagram)

```mermaid
graph TB
    %% External Entities
    CASHIERS[CASHIERS<br/>• Process Orders<br/>• Handle Payments<br/>• Manage Tables<br/>• Print Invoices]
    ADMINS[ADMINS<br/>• User Management<br/>• Inventory Control<br/>• System Settings<br/>• Reports & Analytics]
    CUSTOMERS[DINE-IN CUSTOMERS<br/>• Provide Order Details<br/>• Make Payments<br/>• Receive Invoices]
    
    %% Central System
    POS[DINE-IN RESTAURANT POS SYSTEM<br/>• Order Processing<br/>• Table Management<br/>• Inventory Management<br/>• User Management<br/>• Menu Management<br/>• Reporting System<br/>• Settings Management<br/>• Real-time Updates]
    
    %% Data Flows - Customers to Cashiers
    CUSTOMERS -->|Order Details| CASHIERS
    CUSTOMERS -->|Payment| CASHIERS
    CASHIERS -->|Invoice| CUSTOMERS
    
    %% Data Flows - Cashiers to System
    CASHIERS -->|Create Order| POS
    CASHIERS -->|Make Payment| POS
    CASHIERS -->|Table Status| POS
    CASHIERS -->|Menu Request| POS
    
    POS -->|Order Confirmation| CASHIERS
    POS -->|Payment Confirmation| CASHIERS
    POS -->|Table Info| CASHIERS
    POS -->|Menu Data| CASHIERS
    POS -->|Basic Report| CASHIERS
    
    %% Data Flows - Admins to System
    ADMINS -->|User Management| POS
    ADMINS -->|Inventory| POS
    ADMINS -->|Settings| POS
    ADMINS -->|Menu Management| POS
    ADMINS -->|Stock Management| POS
    ADMINS -->|Report Request| POS
    
    POS -->|User Data| ADMINS
    POS -->|Inventory Report| ADMINS
    POS -->|Settings Config| ADMINS
    POS -->|Menu Data| ADMINS
    POS -->|Stock Data| ADMINS
    POS -->|Reports| ADMINS
    POS -->|Analytics| ADMINS
    
    %% Styling
    classDef externalEntity fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef system fill:#f3e5f5,stroke:#4a148c,stroke-width:3px
    
    class CASHIERS,ADMINS,CUSTOMERS externalEntity
    class POS system
```

## How to Use This Diagram

### **1. GitHub/GitLab**
- Copy the Mermaid code block above
- Paste it into your markdown file
- It will automatically render

### **2. Online Mermaid Editor**
- Go to [mermaid.live](https://mermaid.live)
- Paste the code
- Export as PNG, SVG, or PDF

### **3. VS Code**
- Install "Mermaid Preview" extension
- Create a .md file with the code
- Right-click and select "Open Preview"

### **4. Notion**
- Create a code block
- Select "Mermaid" as language
- Paste the code

## Diagram Features

### **External Entities (Blue Rectangles):**
- **CASHIERS**: Order processing and customer interaction
- **ADMINS**: System management and reporting
- **DINE-IN CUSTOMERS**: Order placement and payment

### **Central System (Purple Circle):**
- **DINE-IN RESTAURANT POS SYSTEM**: All core functions

### **Data Flows (Labeled Arrows):**
- Clear, specific labels showing exact data movement
- Bidirectional flows where appropriate
- Restaurant-specific terminology

This Mermaid diagram will render as a professional context diagram showing all the relationships and data flows in your dine-in restaurant POS system!

