import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PriceEditor = () => {
  // hardwarePrices stores the original and editable prices:
  // [{ hardware_id, name, price, stock_quantity, supplier_name, ... , newPrice }]
  const [hardwarePrices, setHardwarePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching Effect (Adapted from Purchasing.jsx) ---
  useEffect(() => {
    const fetchHardwarePrices = async () => {
      setLoading(true);
      try {
        // Use the same endpoint as Purchasing.jsx to get all hardware data
        const response = await axios.get("/api/purchasing/hardware");

        // Map the data to include a 'newPrice' field for local editing
        const initialPrices = response.data.map((item) => ({
          ...item,
          // Initialize newPrice with the current price for a clean starting state
          newPrice: item.price,
        }));

        setHardwarePrices(initialPrices);
      } catch (err) {
        console.error("Error fetching hardware for price editing:", err);
        toast.error(
          "Failed to load hardware catalog. Check server connection."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHardwarePrices();
  }, []);

  // --- Helper Function (Copied from Purchasing.jsx) ---
  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "N/A";

    // Use 'fil-PH' locale and 'PHP' currency code for Philippine Peso (₱)
    return new Intl.NumberFormat("fil-PH", {
      style: "currency",
      currency: "PHP",
    }).format(numericAmount);
  };

  // --- Price Management ---
  const handlePriceChange = (id, value) => {
    // Basic validation: must be a valid number and non-negative
    let newPrice = parseFloat(value);

    // Set to 0 if invalid or negative, otherwise use the parsed value
    if (isNaN(newPrice) || newPrice < 0) {
      newPrice = 0;
    }

    setHardwarePrices((prevPrices) =>
      prevPrices.map((item) =>
        item.hardware_id === id
          ? { ...item, newPrice: newPrice.toFixed(2) } // Keep two decimal places
          : item
      )
    );
  };

  // --- Submission Logic ---
  const handleSavePrices = async () => {
    const updates = hardwarePrices
      .filter((item) => {
        // Only include items where the price has actually changed from the original
        // Convert to float for accurate comparison
        const originalPrice = parseFloat(item.price);
        const submittedPrice = parseFloat(item.newPrice);

        return originalPrice !== submittedPrice;
      })
      .map((item) => ({
        id: item.hardware_id,
        name: item.name,
        // Send the new price as a string to the backend
        newPrice: item.newPrice,
      }));

    if (updates.length === 0) {
      toast.warn("No price changes detected. Nothing to save.");
      return;
    }

    setIsSubmitting(true);

    try {
      // POST the changes to a dedicated pricing update endpoint
      const response = await axios.post("/api/pricing/update", {
        priceUpdates: updates,
      });

      // Update the frontend state to reflect the new saved prices
      setHardwarePrices((prevPrices) =>
        prevPrices.map((item) => {
          const updatedItem = updates.find((u) => u.id === item.hardware_id);
          if (updatedItem) {
            // Update the original 'price' field to the 'newPrice' for future comparisons
            return { ...item, price: updatedItem.newPrice };
          }
          return item;
        })
      );

      toast.success(response.data.message || "Prices updated successfully!");
      console.log("Price Update Successful:", response.data);
    } catch (error) {
      console.error("Failed to update prices:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Could not connect to the server or an unknown error occurred.";
      toast.error(`Price update failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items to show only those with changes, for summary/review
  const itemsWithChanges = hardwarePrices.filter((item) => {
    return parseFloat(item.price) !== parseFloat(item.newPrice);
  });

  const totalChanges = itemsWithChanges.length;

  return (
    <div className='p-4 md:p-8 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold text-gray-800 pb-2 border-b-1 border-black'>
        Inbound Pricing Editor
      </h1>

      {/* MAIN CONTENT AREA: Editor Grid + Sidebar */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* COLUMN 1-3: Hardware Editor List */}
        <div className='lg:col-span-3'>
          {loading ? (
            <p className='text-center text-xl text-gray-500'>
              Loading hardware data...
            </p>
          ) : (
            <div className='space-y-4'>
              {hardwarePrices.length > 0 ? (
                hardwarePrices.map((hardware) => (
                  <div
                    key={hardware.hardware_id}
                    className='bg-white p-4 rounded-xl shadow-md flex justify-between items-center transition duration-200 hover:shadow-lg'
                  >
                    {/* Item Info */}
                    <div className='flex-grow min-w-0 pr-4'>
                      <h2 className='text-lg font-semibold text-gray-800 truncate'>
                        {hardware.name}
                      </h2>
                      <p className='text-sm text-gray-500'>
                        Current Price:{" "}
                        <span className='font-medium text-green-600'>
                          {formatCurrency(hardware.price)}
                        </span>
                      </p>
                    </div>

                    {/* Price Input */}
                    <div className='flex items-center space-x-3'>
                      <label
                        htmlFor={`price-${hardware.hardware_id}`}
                        className='text-gray-700 font-medium text-base whitespace-nowrap'
                      >
                        New Price (PHP):
                      </label>
                      <input
                        id={`price-${hardware.hardware_id}`}
                        type='number'
                        min='0.00'
                        step='0.01'
                        value={hardware.newPrice}
                        onChange={(e) =>
                          handlePriceChange(
                            hardware.hardware_id,
                            e.target.value
                          )
                        }
                        className='w-32 p-2 border-2 border-gray-300 rounded-lg text-center bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-inner font-mono'
                      />

                      {/* Change Indicator */}
                      {parseFloat(hardware.price) !==
                        parseFloat(hardware.newPrice) && (
                        <span className='text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-800'>
                          EDITED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className='col-span-full text-center text-xl text-red-500 font-semibold'>
                  ⚠️ No hardware items loaded for editing.
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 4: Summary Sidebar */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4 bg-white p-6 rounded-xl shadow-2xl h-full lg:h-auto'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b pb-2'>
              Price Change Summary
            </h2>

            {/* List of Changes */}
            <div className='space-y-3 max-h-[60vh] overflow-y-auto pr-2'>
              {itemsWithChanges.length > 0 ? (
                itemsWithChanges.map((item) => (
                  <div key={item.id} className='text-sm border-b pb-2'>
                    <p className='font-semibold text-gray-700 truncate'>
                      {item.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Old: {formatCurrency(item.price)}
                    </p>
                    <p className='text-xs font-bold text-red-600'>
                      New: {formatCurrency(item.newPrice)}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-gray-500 italic pt-2'>
                  Edit the prices in the main list to see changes here.
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className='mt-6 pt-4 border-t border-gray-300'>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-bold text-gray-800'>
                  Items to Update:
                </span>
                <span className='text-2xl font-extrabold text-blue-700'>
                  {totalChanges}
                </span>
              </div>

              <button
                onClick={handleSavePrices}
                className={`w-full font-semibold py-3 rounded-lg transition duration-150 shadow-md 
                                    ${
                                      totalChanges > 0 && !isSubmitting
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    }`}
                disabled={totalChanges === 0 || isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : `Save ${totalChanges} Price Changes`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceEditor;
