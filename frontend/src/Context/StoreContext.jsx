
import { createContext, useCallback, useEffect, useState } from "react";
import { food_list, menu_list } from "../assets/assets";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  const url = (
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  // Use local demo food data immediately so the UI can render.
  const [foodList, setFoodList] = useState(
    Array.isArray(food_list) ? food_list : []
  );
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const currency = "₹";
  const deliveryCharge = 50;

  const fetchFoodList = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`, {
        timeout: 5000,
      });

      if (
        response.data?.success &&
        Array.isArray(response.data.data)
      ) {
        setFoodList(response.data.data);
      }
    } catch (error) {
      // Keep local demo data if the backend is unavailable.
      console.warn(
        "Backend unavailable; using local demo food data.",
        error.message
      );
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
            timeout: 5000,
          }
        );

        if (response.data?.cartData) {
          setCartItems(response.data.cartData);
        }
      } catch (error) {
        console.warn("Unable to load saved cart:", error.message);

        if ([401, 403].includes(error.response?.status)) {
          localStorage.removeItem("token");
          setToken("");
        }
      }
    },
    [url]
  );

  const addToCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (Number(prev[itemId]) || 0) + 1,
    }));

    // Local demo mode: don't require a backend.
    if (!token) return;

    try {
      await axios.post(
        `${url}/api/cart/add`,
        { itemId },
        { headers: { token }, timeout: 5000 }
      );
    } catch (error) {
      console.warn("Cart could not sync with backend:", error.message);
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (Number(prev[itemId]) || 0) - 1),
    }));

    if (!token) return;

    try {
      await axios.post(
        `${url}/api/cart/remove`,
        { itemId },
        { headers: { token }, timeout: 5000 }
      );
    } catch (error) {
      console.warn("Cart could not sync with backend:", error.message);
    }
  };

  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce(
      (total, [itemId, quantity]) => {
        const item = foodList.find(
          (product) => String(product._id) === String(itemId)
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
    fetchFoodList();

    const savedToken = localStorage.getItem("token") || "";
    setToken(savedToken);

    if (savedToken) {
      loadCartData(savedToken);
    }
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
