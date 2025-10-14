// src/features/Inventory/Inventory.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios"; // <-- REQUIRED: Import axios for API calls
import { toast } from "react-toastify"; // <-- REQUIRED: Import toast for feedback
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getFilteredRowModel,
} from "@tanstack/react-table";

// ----------------------------------------------------------------------
// COLUMN DEFINITION (Updated to use expected DB field names)
// ----------------------------------------------------------------------
const columnHelper = createColumnHelper();

const columns = [
  // Mapped from 'sku' to 'hardware_id'
  columnHelper.accessor("name", { header: "Product Name" }),
  columnHelper.accessor("description", { header: "Description" }),
  columnHelper.accessor("uom", { header: "UOM" }),
  // Mapped from 'category' to 'item_type'
  columnHelper.accessor("item_type", { header: "Category", id: "item_type" }),
  // Mapped from 'storageLocation' to 'storage_location'
  columnHelper.accessor("storage_location", { header: "Location" }),
  // Mapped from 'locatorBin' to 'locator_bin'
  columnHelper.accessor("locator_bin", { header: "Bin/Locator" }),
  // Mapped from 'quantity' to 'stock_quantity'
  columnHelper.accessor("stock_quantity", {
    header: "Qty On Hand",
    id: "stock_quantity",
    cell: (info) => parseInt(info.getValue(), 10).toLocaleString(),
  }),
  columnHelper.accessor("price", {
    header: "Unit Price",
    cell: (info) => `₱${parseFloat(info.getValue()).toFixed(2)}`,
  }),
  columnHelper.accessor("stock_quantity", {
    // Re-using stock_quantity to derive status
    header: "Stock Status",
    id: "status",
    cell: (info) => {
      const quantity = parseInt(info.getValue(), 10);
      let status = "In Stock";
      let style = { color: "green" };

      if (quantity <= 10 && quantity > 0) {
        status = "Low Stock";
        style = { color: "orange" };
      } else if (quantity === 0) {
        status = "Out of Stock";
        style = { color: "red", fontWeight: "bold" };
      }

      return <span style={style}>{status}</span>;
    },
  }),
];

// ----------------------------------------------------------------------
// COMPONENT: AddItemForm (Updated to use expected DB field names and API logic)
// ----------------------------------------------------------------------
function AddItemForm({ uniqueItemTypes, onAddItem, onCancel }) {
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    uom: "Each",
    item_type: uniqueItemTypes[0] || "", // Mapped from 'category'
    storage_location: "", // Mapped from 'storageLocation'
    locator_bin: "", // Mapped from 'locatorBin'
    stock_quantity: 0, // Mapped from 'quantity'
    price: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    const qty = parseInt(newItem.stock_quantity, 10);
    const price = parseFloat(newItem.price);

    if (!newItem.name || !newItem.item_type || qty < 0 || price <= 0) {
      toast.error(
        "Please fill out all fields correctly. Quantity must be non-negative and Price must be positive."
      );
      return;
    }

    try {
      // POST the new item data to the backend
      // NOTE: The backend API endpoint for creating a new hardware item is assumed here.
      // If the actual API is different, this needs adjustment.
      const response = await axios.post("/api/purchasing/hardware/add", {
        ...newItem,
        stock_quantity: qty,
        price: price,
      });

      // Assuming the API returns the newly created item with its final ID
      const createdItem = response.data;

      // Update the local state via the prop function
      onAddItem(createdItem);

      toast.success(`Item "${newItem.name}" added successfully!`);
    } catch (error) {
      console.error("Failed to add new item:", error);
      toast.error(
        `Failed to add new item. ${
          error.response?.data?.message || "Please try again."
        }`
      );
    }
  };

  const inputStyle =
    "w-full p-2 border border-gray-300 rounded-lg text-gray-900 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const buttonBaseStyle =
    "font-semibold py-2 px-4 rounded-lg transition duration-150 shadow-md";

  return (
    <div className='p-6 mb-6 bg-white border border-gray-100 rounded-xl shadow-2xl'>
      <h3 className='text-xl font-bold text-gray-800 mb-6 border-b pb-3'>
        Record New Inventory Item 📝
      </h3>

      <form
        onSubmit={handleSubmit}
        className='grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6'
      >
        {/* COLUMN 1: Item Master Data */}
        <div className='space-y-6'>
          {/* Product Name */}
          <div>
            <label htmlFor='name' className={labelStyle}>
              Product Name
            </label>
            <input
              id='name'
              type='text'
              name='name'
              value={newItem.name}
              onChange={handleChange}
              placeholder='e.g., Digital Multimeter'
              required
              className={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor='description' className={labelStyle}>
              Description
            </label>
            <textarea
              id='description'
              name='description'
              value={newItem.description}
              onChange={handleChange}
              placeholder='Brief details about the item...'
              rows='2'
              required
              className={inputStyle}
            />
          </div>

          {/* Category (Item Type) */}
          <div>
            <label htmlFor='item_type' className={labelStyle}>
              Category
            </label>
            <select
              id='item_type'
              name='item_type'
              value={newItem.item_type}
              onChange={handleChange}
              required
              className={inputStyle}
            >
              <option value=''>-- Select Item Type --</option>
              {uniqueItemTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* UOM */}
          <div>
            <label htmlFor='uom' className={labelStyle}>
              Unit of Measure (UOM)
            </label>
            <input
              id='uom'
              type='text'
              name='uom'
              value={newItem.uom}
              onChange={handleChange}
              placeholder='e.g., Each, Box, Roll'
              required
              className={inputStyle}
            />
          </div>
        </div>

        {/* COLUMN 2: Inventory & Financial Data */}
        <div className='space-y-6'>
          {/* Storage Location */}
          <div>
            <label htmlFor='storage_location' className={labelStyle}>
              Storage Location
            </label>
            <input
              id='storage_location'
              type='text'
              name='storage_location'
              value={newItem.storage_location}
              onChange={handleChange}
              placeholder='e.g., WH-A, YARD-1'
              required
              className={inputStyle}
            />
          </div>

          {/* Locator/Bin */}
          <div>
            <label htmlFor='locator_bin' className={labelStyle}>
              Locator/Bin
            </label>
            <input
              id='locator_bin'
              type='text'
              name='locator_bin'
              value={newItem.locator_bin}
              onChange={handleChange}
              placeholder='e.g., A1-01, STACK-B'
              required
              className={inputStyle}
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor='stock_quantity' className={labelStyle}>
              Quantity On Hand
            </label>
            <input
              id='stock_quantity'
              type='number'
              name='stock_quantity'
              value={newItem.stock_quantity}
              onChange={handleChange}
              min='0'
              required
              className={inputStyle}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor='price' className={labelStyle}>
              Unit Price (₱)
            </label>
            <input
              id='price'
              type='number'
              name='price'
              value={newItem.price}
              onChange={handleChange}
              min='0.01'
              step='0.01'
              required
              className={inputStyle}
            />
          </div>
        </div>

        {/* Buttons - Spanning both columns */}
        <div className='md:col-span-2 flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100'>
          <button
            type='button'
            onClick={onCancel}
            className={`${buttonBaseStyle} bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-lg`}
          >
            Cancel
          </button>
          <button
            type='submit'
            className={`${buttonBaseStyle} bg-green-500 text-white hover:bg-green-600 hover:shadow-lg`}
          >
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Component (Inventory - NOW WITH DATA FETCHING)
// ----------------------------------------------------------------------
export default function Inventory() {
  const [loading, setLoading] = useState(true); // State to handle loading
  const [inventoryData, setInventoryData] = useState([]); // Initial state is empty array

  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  // --- Data Fetching Logic ---
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      // API call to fetch all hardware inventory data
      const response = await axios.get("/api/purchasing/hardware");
      setInventoryData(response.data);
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      toast.error(
        "Failed to load inventory data. Check network connection or API status."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  // ---------------------------

  const data = useMemo(() => inventoryData, [inventoryData]);
  const cols = useMemo(() => columns, []);

  // Dynamically generate unique categories/item types from fetched data
  const uniqueItemTypes = useMemo(() => {
    const set = new Set(inventoryData.map((item) => item.item_type));
    return Array.from(set).filter(Boolean).sort();
  }, [inventoryData]);

  // Function to handle adding a new item (re-fetches data or performs optimistic update)
  const handleAddItem = (createdItem) => {
    // Optimistic Update: Add the new item to the top of the list locally
    setInventoryData((prevData) => [createdItem, ...prevData]);
    setIsAddingItem(false);
  };

  const columnFilters = useMemo(() => {
    return [
      {
        id: "item_type", // Filter is on the 'item_type' column
        value: categoryFilter,
      },
    ].filter((filter) => filter.value);
  }, [categoryFilter]);

  // Initialize the TanStack Table instance
  const table = useReactTable({
    data,
    columns: cols,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className='bg-white rounded-xl shadow-lg p-6 h-full'>
      <h2 className='text-2xl font-bold mb-6 text-gray-800 border-b pb-2'>
        Hardware Inventory Display
      </h2>

      {/* ITEM ADDITION FORM (Conditional Rendering) */}
      {isAddingItem && (
        <AddItemForm
          uniqueItemTypes={uniqueItemTypes} // Pass fetched item types
          onAddItem={handleAddItem}
          onCancel={() => setIsAddingItem(false)}
        />
      )}

      {/* FILTER UI ELEMENTS */}
      <div className='flex justify-between items-center mb-4 flex-wrap'>
        <div className='flex space-x-4 items-center mb-2 md:mb-0'>
          {/* Global Search Input */}
          <input
            type='text'
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Search all columns...'
            className='p-2 border border-gray-300 rounded-lg shadow-sm w-80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150'
            style={{ color: "#212121" }}
          />

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className='p-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150'
            style={{ color: "#212121" }}
          >
            <option value=''>All Categories</option>
            {uniqueItemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Add Item Button */}
        <button
          onClick={() => setIsAddingItem(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isAddingItem || loading}
        >
          + Add New Item
        </button>
      </div>

      {/* Table Structure */}
      <div className='overflow-x-auto'>
        {loading ? (
          <p className='text-center text-xl text-gray-500 py-10'>
            Loading inventory data...
          </p>
        ) : table.getFilteredRowModel().rows.length > 0 ? (
          <table className='min-w-full text-sm'>
            {/* === TABLE HEADER === */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className='p-3 border-b-2 border-gray-200 bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap'
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* === TABLE BODY === */}
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className='hover:bg-gray-50'>
                  {row.getVisibleCells().map((cell) => {
                    const isStatusColumn = cell.column.id === "status";

                    return (
                      <td
                        key={cell.id}
                        className='p-3 border-b border-gray-100 whitespace-nowrap'
                        style={{
                          color: isStatusColumn ? undefined : "#212121",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className='text-center text-lg text-gray-500 py-10'>
            No hardware inventory items found.
          </p>
        )}
      </div>

      <div className='mt-4 text-sm text-gray-600'>
        Showing {table.getFilteredRowModel().rows.length} of {data.length} total
        items.
      </div>
    </div>
  );
}
