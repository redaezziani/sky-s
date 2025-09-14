# Dynamic DataTable System

## Overview

The DataTable system provides a reusable, dynamic table component that can be used across the entire application. It's based on the original ExperienceTable styling and includes all the common table features like filtering, searching, sorting, and actions.

## Architecture

### Core Components

1. **DataTable** (`/src/components/shared/data-table.tsx`)
   - Main reusable table component
   - Handles search, filtering, pagination, actions
   - Consistent styling based on ExperienceTable design

2. **Table Configurations** (`/src/components/shared/table-configs/`)
   - Separate config files for each table type
   - Define columns, filters, actions, and custom rendering
   - Keep business logic separated from UI component

## Usage

### Basic Example (Simple Table)

```tsx
import { DataTable } from "@/components/shared/data-table"
import { getBasicTableConfig } from "@/components/shared/table-configs/basic-table-config"

function MyTable({ items, onEdit, onDelete }) {
  const tableConfig = getBasicTableConfig(onEdit, onDelete, "Search items...")

  return (
    <DataTable
      title="My Items"
      data={items}
      {...tableConfig}
    />
  )
}
```

### Advanced Example (Custom Configuration)

```tsx
import { DataTable } from "@/components/shared/data-table"
import { getUserTableConfig } from "@/components/shared/table-configs/user-table-config"

function UserTable({ users, onEditUser, onDeleteUser }) {
  const tableConfig = getUserTableConfig(onEditUser, onDeleteUser)

  return (
    <DataTable
      title="User Management"
      data={users}
      {...tableConfig}
    />
  )
}
```

### With Add Button

```tsx
import { DataTable } from "@/components/shared/data-table"
import { CreateDialog } from "./create-dialog"

function TableWithAdd({ items, onCreate, onEdit, onDelete }) {
  const [showDialog, setShowDialog] = useState(false)
  const tableConfig = getBasicTableConfig(onEdit, onDelete)

  const addButton = (
    <Button onClick={() => setShowDialog(true)}>
      <IconPlus className="mr-2 h-4 w-4" />
      Add Item
    </Button>
  )

  return (
    <>
      <DataTable
        title="Items"
        data={items}
        addButton={addButton}
        {...tableConfig}
      />
      <CreateDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onCreate={onCreate}
      />
    </>
  )
}
```

## Configuration Options

### DataTable Props

```tsx
interface DataTableProps<T> {
  title: string                    // Table title
  data: T[]                       // Array of data items
  columns: TableColumn<T>[]       // Column definitions
  searchKeys: string[]            // Keys to search within
  searchPlaceholder?: string      // Search input placeholder
  filters?: FilterOption<T>[]     // Filter configurations
  onRowClick?: (item: T) => void  // Row click handler
  actions?: (item: T) => ReactNode // Action buttons
  addButton?: ReactNode           // Add button (renders outside table)
  showCount?: boolean             // Show item count
  emptyMessage?: string           // Custom empty message
  className?: string              // Additional CSS classes
}
```

### Column Configuration

```tsx
interface TableColumn<T> {
  key: string                     // Property key (supports nested: "user.name")
  label: string                   // Column header text
  render?: (item: T) => ReactNode // Custom render function
  sortable?: boolean              // Enable sorting (future feature)
}
```

### Filter Configuration

```tsx
interface FilterOption<T> {
  key: string                     // Unique filter key
  label: string                   // "All [Items]" label
  placeholder: string             // Select placeholder
  options: Array<{value: string, label: string}>  // Filter options
  getValue: (item: T) => string   // Extract filter value from item
}
```

## Available Configurations

### 1. Basic Table Config (`basic-table-config.tsx`)
For simple CRUD tables with name, createdAt, updatedAt columns
- Used by: RoleTable (with custom name rendering)

### 2. User Table Config (`user-table-config.tsx`)
For user management with role and domain filtering
- Custom badge rendering for roles and domains
- Multiple search keys (name, email)
- Two filter options (role, domain)

### 3. Machine Type Config (`machine-type-table-config.tsx`)
For machine type management
- Simple name + timestamps
- Edit/Delete actions

### 4. Game Type Config (`game-type-table-config.tsx`)
For game type management
- Similar to machine type but different action styling

### 5. Experience Config (`experience-table-config.tsx`)
For complex experience data
- Multiple nested properties (machine.name, game.name, dom.name)
- Dynamic filter generation from data
- Price and time formatting
- Click-to-view functionality

### 6. Game Config (`game-table-config.tsx`)
For game management
- Custom price and time formatting
- Badge rendering for types
- Multiple filters (game type, machine type)

### 7. Machine Config (`machine-table-config.tsx`)
For machine management
- Dynamic filter generation from machine types and domains
- Relationship rendering (machine type, domain)

### 8. Dom Config (`dom-table-config.tsx`)
For domain/location management
- Address badge rendering
- Area-based filtering (first word of address)

## Key Features

### 1. Consistent Styling
- Based on ExperienceTable design
- Card wrapper with proper spacing
- Search icon positioning
- Filter layout and clear button
- Action button styling

### 2. Flexible Filtering
- Text search across multiple fields
- Custom dropdown filters
- Clear all filters functionality
- Dynamic filter options from data

### 3. Custom Rendering
- Badge components for status/types
- Date formatting
- Price/currency formatting
- Time duration formatting
- Custom action buttons

### 4. Responsive Design
- Mobile-friendly filter layout
- Responsive column sizing
- Proper touch targets

### 5. Add Button Support
- External add button (outside table)
- Consistent header layout
- Dialog management support

## Migration Benefits

### Before (Individual Tables)
- 7 separate table components (~100-200 lines each)
- Duplicate logic for search, filters, styling
- Inconsistent patterns and styling
- Hard to maintain and update

### After (DataTable System)
- 1 reusable DataTable component (~220 lines)
- 8 configuration files (~20-80 lines each)
- Consistent patterns and styling
- Easy to add new tables
- Single place to update common functionality

### Code Reduction
- **Before**: ~1000+ lines of repetitive table code
- **After**: ~220 lines core + ~400 lines configs = ~620 lines total
- **Savings**: ~40% reduction + consistency + maintainability

## Adding New Tables

1. Create a new config file in `/table-configs/`
2. Define your data interface
3. Create the configuration function
4. Use DataTable in your component

```tsx
// 1. Create config file
export const getMyTableConfig = (onEdit, onDelete) => ({
  columns: [
    { key: "name", label: "Name" },
    { key: "status", label: "Status", render: (item) => <Badge>{item.status}</Badge> }
  ],
  searchKeys: ["name"],
  searchPlaceholder: "Search items...",
  actions: (item) => (
    <>
      <Button onClick={() => onEdit(item)}>Edit</Button>
      <Button onClick={() => onDelete(item.id)}>Delete</Button>
    </>
  ),
})

// 2. Use in component
function MyTable({ items, onEdit, onDelete }) {
  const config = getMyTableConfig(onEdit, onDelete)
  return <DataTable title="My Items" data={items} {...config} />
}
```

## Future Enhancements

1. **Sorting**: Add column sorting functionality
2. **Pagination**: Add pagination for large datasets
3. **Export**: Add CSV/Excel export functionality
4. **Column Visibility**: Toggle column visibility
5. **Bulk Actions**: Select multiple rows for bulk operations
6. **Advanced Filters**: Date ranges, numeric ranges
7. **Save Filter State**: Remember user's filter preferences
