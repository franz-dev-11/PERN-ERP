// src/features/Inventory/Inventory.jsx
import React, { useMemo, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  createColumnHelper,
  getFilteredRowModel,
} from '@tanstack/react-table';

// --- Dummy Data (Hardware Store Inventory) ---
const defaultData = [
  { sku: 'T-101', name: 'Claw Hammer, 16oz', category: 'Tools', quantity: 75, price: 18.99, status: 'In Stock' },
  { sku: 'F-205', name: 'Wood Screws, Box of 100', category: 'Fasteners', quantity: 22, price: 5.49, status: 'Low Stock' },
  { sku: 'L-310', name: '2x4 Pine Stud, 8ft', category: 'Lumber', quantity: 500, price: 6.95, status: 'In Stock' },
  { sku: 'E-450', name: 'Electrical Tape, Black', category: 'Electrical', quantity: 5, price: 2.15, status: 'Out of Stock' },
  { sku: 'P-501', name: 'PVC Pipe Connector, 1.5in', category: 'Plumbing', quantity: 120, price: 3.50, status: 'In Stock' },
  { sku: 'T-109', name: 'Digital Multimeter', category: 'Tools', quantity: 8, price: 45.99, status: 'Low Stock' },
];

const categories = ['Tools', 'Fasteners', 'Lumber', 'Electrical', 'Plumbing'];

// --- Define Columns ---
const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('sku', { header: 'SKU' }),
  columnHelper.accessor('name', { header: 'Product Name' }),
  columnHelper.accessor('category', { 
    header: 'Category',
    id: 'category' 
  }), 
  columnHelper.accessor('quantity', {
    header: 'Qty On Hand',
    cell: info => info.getValue().toLocaleString(),
  }),
  columnHelper.accessor('price', {
    header: 'Unit Price',
    // CURRENCY UPDATE: Changed '$' to '₱'
    cell: info => `₱${info.getValue().toFixed(2)}`,
  }),
  columnHelper.accessor('status', {
    header: 'Stock Status',
    cell: info => {
      const status = info.getValue();
      let style = { color: 'green' }; 
      if (status === 'Low Stock') style = { color: 'orange' };
      if (status === 'Out of Stock') style = { color: 'red', fontWeight: 'bold' };
      
      return <span style={style}>{status}</span>;
    },
  }),
];

// --- Main Component ---
export default function Inventory() {
  
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const data = useMemo(() => defaultData, []);
  const cols = useMemo(() => columns, []);

  // ⭐️ FIX: Memoize the columnFilters array
  const columnFilters = useMemo(() => {
    return [
      {
        id: 'category', // Must match the column ID/accessor key
        value: categoryFilter,
      }
    ].filter(filter => filter.value); // Only pass filters with a value
  }, [categoryFilter]); // Re-calculate only when categoryFilter changes


  // Initialize the TanStack Table instance
  const table = useReactTable({
    data,
    columns: cols,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), 
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters, // Pass the memoized array
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Hardware Inventory Display</h2>

      {/* FILTER UI ELEMENTS */}
      <div className="flex space-x-4 mb-4 items-center">
        {/* Global Search Input */}
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search all columns..."
          className="p-2 border border-gray-300 rounded-md shadow-sm w-80"
          style={{color: '#212121'}}
        />

        {/* Category Dropdown Filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md shadow-sm"
          style={{color: '#212121'}}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      {/* Table Structure */}
      <table className="w-full text-sm">
        
        {/* === TABLE HEADER === */}
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  colSpan={header.colSpan}
                  className="p-3 border-b-2 border-gray-200 bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {header.isPlaceholder ? null : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        
        {/* === TABLE BODY === */}
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map(cell => {
                
                const isStatusColumn = cell.column.id === 'status';

                return (
                  <td 
                    key={cell.id} 
                    className="p-3 border-b border-gray-100"
                    style={{ color: isStatusColumn ? undefined : '#212121' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-sm text-gray-600">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} items.
      </div>
    </div>
  );
}