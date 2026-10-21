
import { createContext, useCallback, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  // Set VITE_BACKEND_URL in the frontend's Render environment.
  const url = (
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  const [foodList, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const currency = "₹";
  const deliveryCharge = 50;

  const fetchFoodList = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`, {
        timeout: 20000,
      });

      const items = response.data?.data;

      if (!response.data?.success || !Array.isArray(items)) {
        throw new Error("Invalid response from food API");
      }

      setFoodList(items);
      return true;
    } catch (error) {
      console.error(
        "Food list request failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }, [url]);

  const loadCartData = useCallback(
    async (savedToken) => {
      if (!savedToken) return;

      try {
        const response = await axios.post(
          `${url}/api/cart/get`,
          {},
          {
            headers: { token: savedToken },
            timeout: 15000,
          }
        );

        if (response.data?.cartData) {
          setCartItems(response.data.cartData);
        }
      } catch (error) {
        console.error(
          "Cart request failed:",
          error.response?.data || error.message
        );

        if ([401, 403].includes(error.response?.status)) {
          localStorage.removeItem("token");
          setToken("");
        }
      }
    },
    [url]
  );

  const addToCart = async (itemId) => {
    const previousCart = cartItems;

    setCartItems((prev) => ({
      ...prev,
      [itemId]: (Number(prev[itemId]) || 0) + 1,
    }));

    if (!token) return;

    try {
      await axios.post(
        `${url}/api/cart/add`,
        { itemId },
        { headers: { token }, timeout: 15000 }
      );
    } catch (error) {
      console.error("Add-to-cart failed:", error.message);
      setCartItems(previousCart);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    const currentQuantity = Number(cartItems[itemId]) || 0;

    if (currentQuantity <= 0) return;

    const previousCart = cartItems;

    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (Number(prev[itemId]) || 0) - 1),
    }));

    if (!token) return;

    try {
      await axios.post(
        `${url}/api/cart/remove`,
        { itemId },
        { headers: { token }, timeout: 15000 }
      );
    } catch (error) {
      console.error("Remove-from-cart failed:", error.message);
      setCartItems(previousCart);
      throw error;
    }
  };

  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce(
      (total, [itemId, quantity]) => {
        const item = foodList.find(
          (product) => product._id === itemId
        );

        const qty = Number(quantity);
        const price = Number(item?.price);

        if (
          !item ||
          !Number.isFinite(qty) ||
          !Number.isFinite(price) ||
          qty <= 0 ||
          price < 0
        ) {
          return total;
        }

        return total + price * qty;
      },
      0
    );
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        await fetchFoodList();

        if (cancelled) return;

        const savedToken = localStorage.getItem("token") || "";

        setToken(savedToken);

        if (savedToken) {
          await loadCartData(savedToken);
        }
      } catch (error) {
        console.error("Store initialization failed:", error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [fetchFoodList, loadCartData]);

  const contextValue = {
    url,
    food_list: foodList,
    menu_list,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    token,
    setToken,
    loadCartData,
    setCartItems,
    currency,
    deliveryCharge,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
