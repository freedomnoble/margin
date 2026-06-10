import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState(null); // null = loading
  const [currentId, setCurrentId] = useState(() => localStorage.getItem("margin_biz") || "");

  const load = useCallback(async () => {
    const { data } = await api.get("/businesses");
    setBusinesses(data);
    return data;
  }, []);

  useEffect(() => {
    load().catch(() => setBusinesses([]));
  }, [load]);

  const current =
    (businesses || []).find((b) => b.id === currentId) || (businesses || [])[0] || null;

  const selectBusiness = (id) => {
    setCurrentId(id);
    localStorage.setItem("margin_biz", id);
  };

  const createBusiness = async (name) => {
    const { data } = await api.post("/businesses", { name });
    setBusinesses((prev) => [...(prev || []), data]);
    selectBusiness(data.id);
    return data;
  };

  const updateBusiness = async (patch) => {
    if (!current) return null;
    const { data } = await api.put(`/businesses/${current.id}`, patch);
    setBusinesses((prev) => (prev || []).map((b) => (b.id === data.id ? data : b)));
    return data;
  };

  const deleteBusiness = async (id) => {
    await api.delete(`/businesses/${id}`);
    setBusinesses((prev) => (prev || []).filter((b) => b.id !== id));
  };

  return (
    <BusinessContext.Provider
      value={{ businesses, current, selectBusiness, createBusiness, updateBusiness, deleteBusiness, reload: load }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
