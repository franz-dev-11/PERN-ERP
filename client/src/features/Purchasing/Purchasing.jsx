import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Purchasing = () => {
  const [hardwareList, setHardwareList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [loading, setLoading] = useState(true);

  // State for managing the user's current purchase selections: { hardware_id: quantity }
  const [purchaseItems, setPurchaseItems] = useState({});

  // --- Data Fetching Effects (Unchanged) ---
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get("/api/purchasing/suppliers");
        setSuppliers(response.data);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchHardware = async () => {
      setLoading(true);
      try {
        const url = selectedSupplier
          ? `/api/purchasing/hardware?supplierId=${selectedSupplier}`
          : "/api/purchasing/hardware";

        const response = await axios.get(url);
        setHardwareList(response.data);
      } catch (err) {
        console.error("Error fetching hardware:", err);
        toast.error(
          "Failed to load hardware catalog. Check server connection."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHardware();
  }, [selectedSupplier]);

  // --- Helper Functions ---
  const handleSupplierChange = (event) => {
    setSelectedSupplier(event.target.value);
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "N/A";

    // REVISED: Use 'fil-PH' locale and 'PHP' currency code for Philippine Peso (₱)
    return new Intl.NumberFormat("fil-PH", {
      style: "currency",
      currency: "PHP",
    }).format(numericAmount);
  };

  // --- Quantity Management (Unchanged) ---
  const handleQuantityChange = (id, value) => {
    let newQuantity = parseInt(value, 10);

    if (isNaN(newQuantity) || newQuantity < 0) {
      newQuantity = 0;
    }

    setPurchaseItems((prevItems) => {
      const updatedItems = { ...prevItems };

      if (newQuantity === 0) {
        delete updatedItems[id];
      } else {
        updatedItems[id] = newQuantity;
      }
      return updatedItems;
    });
  };

  // --- Purchase Order Submission (Unchanged) ---
  const handlePlacePurchaseOrder = async () => {
    const itemsToOrder = Object.keys(purchaseItems)
      .filter((id) => purchaseItems[id] > 0)
      .map((id) => {
        const itemId = parseInt(id);
        const item = hardwareList.find((h) => h.hardware_id === itemId);

        return {
          id: itemId,
          name: item ? item.name : "Unknown Item",
          quantity: purchaseItems[itemId],
          price: item ? item.price : 0,
        };
      });

    if (itemsToOrder.length === 0) {
      toast.warn("Your purchase order is empty. Add items before ordering.");
      return;
    }

    try {
      const response = await axios.post("/api/purchasing/order", {
        items: itemsToOrder,
      });

      // 1. Real-time Frontend Stock Update
      setHardwareList((prevList) => {
        const orderedQuantities = new Map(
          itemsToOrder.map((item) => [item.id, item.quantity])
        );

        return prevList.map((hardware) => {
          const addedQty = orderedQuantities.get(hardware.hardware_id);

          if (addedQty) {
            const currentStock = parseInt(hardware.stock_quantity, 10);
            return {
              ...hardware,
              stock_quantity: (currentStock + addedQty).toString(),
            };
          }
          return hardware;
        });
      });

      // 2. Clear Selections and show confirmation
      setPurchaseItems({});
      toast.success(response.data.message);
      console.log("Order Successful:", response.data);
    } catch (error) {
      console.error("Failed to place purchase order:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Could not connect to the server or an unknown error occurred.";
      toast.error(`Order failed: ${errorMessage}`);
    }
  };

  // --- Order Summary Calculation ---
  const totalItemsInOrder = Object.keys(purchaseItems).length;

  const selectedItemsDetails = Object.keys(purchaseItems)
    .map((id) => {
      const item = hardwareList.find((h) => h.hardware_id === parseInt(id));
      if (!item) return null;

      const quantity = purchaseItems[id];
      const lineTotal = item.price * quantity;

      return {
        id: item.hardware_id,
        name: item.name,
        quantity: quantity,
        price: item.price,
        lineTotal: lineTotal,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.id - b.id);

  const orderTotal = selectedItemsDetails.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  return (
    <div className='p-4 md:p-8 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold text-gray-800 pb-2 border-b-1 border-black'>
        Purchasing Catalog
      </h1>

      {/* Filter Section */}
      <div className='flex justify-start space-x-4 mb-8 p-4 bg-white shadow-md rounded-lg'>
        <label
          htmlFor='supplier-select'
          className='text-lg font-medium text-black'
        >
          Filter by Supplier:
        </label>
        <select
          id='supplier-select'
          value={selectedSupplier}
          onChange={handleSupplierChange}
          className='p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-w-[200px] text-gray-900'
        >
          <option value=''>-- All Suppliers --</option>
          {suppliers.map((supplier) => (
            <option key={supplier.supplier_id} value={supplier.supplier_id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      {/* MAIN CONTENT AREA: Catalog Grid + Sidebar */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* COLUMN 1-3: Hardware Catalog */}
        <div className='lg:col-span-3'>
          {loading ? (
            <p className='text-center text-xl text-gray-500'>
              Loading hardware data...
            </p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
              {hardwareList.length > 0 ? (
                hardwareList.map((hardware) => (
                  <div
                    key={hardware.hardware_id}
                    className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 flex flex-col'
                  >
                    <h2 className='text-xl font-semibold text-blue-600 mb-2'>
                      {hardware.name}
                    </h2>
                    <p className='text-sm italic text-gray-500 mb-3'>
                      Supplier: {hardware.supplier_name}
                    </p>
                    <p className='text-gray-600 mb-4 flex-grow'>
                      {hardware.description}
                    </p>

                    {/* Card Details (Price & Stock) */}
                    <div className='flex justify-between items-center pt-4 border-t border-dashed border-gray-200'>
                      <span className='text-lg font-bold text-green-600'>
                        {formatCurrency(hardware.price)}
                      </span>
                      <span className='text-sm font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full'>
                        Stock: {hardware.stock_quantity}
                      </span>
                    </div>

                    {/* Quantity Input */}
                    <div className='mt-4 pt-4 border-t border-gray-100 flex items-center justify-between'>
                      <label
                        htmlFor={`qty-${hardware.hardware_id}`}
                        className='text-gray-700 font-semibold text-base'
                      >
                        Qty to Order:
                      </label>
                      <input
                        id={`qty-${hardware.hardware_id}`}
                        type='number'
                        min='0'
                        value={purchaseItems[hardware.hardware_id] || ""}
                        onChange={(e) =>
                          handleQuantityChange(
                            hardware.hardware_id,
                            e.target.value
                          )
                        }
                        className='w-20 p-2 border-2 border-gray-300 rounded-lg text-center bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-inner'
                        placeholder='0'
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className='col-span-full text-center text-xl text-red-500 font-semibold'>
                  ⚠️ No hardware found for the selected filter.
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 4: Order Summary Sidebar */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4 bg-white p-6 rounded-xl shadow-2xl h-full lg:h-auto'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b pb-2'>
              Purchase Order Cart
            </h2>

            {/* List of Added Items */}
            <div className='space-y-3 max-h-[60vh] overflow-y-auto pr-2'>
              {selectedItemsDetails.length > 0 ? (
                selectedItemsDetails.map((item) => (
                  <div key={item.id} className='text-sm border-b pb-2'>
                    <p className='font-semibold text-gray-700 truncate'>
                      {item.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Qty: {item.quantity} @ {formatCurrency(item.price)}
                    </p>
                    <p className='text-xs font-bold text-blue-600'>
                      Subtotal: {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-gray-500 italic pt-2'>
                  Add items to the order using the quantity inputs.
                </p>
              )}
            </div>

            {/* Order Total and Button */}
            <div className='mt-6 pt-4 border-t border-gray-300'>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-bold text-gray-800'>
                  Order Total:
                </span>
                <span className='text-2xl font-extrabold text-green-700'>
                  {formatCurrency(orderTotal)}
                </span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlacePurchaseOrder}
                className={`w-full font-semibold py-3 rounded-lg transition duration-150 shadow-md 
                                    ${
                                      totalItemsInOrder > 0
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    }`}
                disabled={totalItemsInOrder === 0}
              >
                Place Purchase Order ({totalItemsInOrder} items)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;
