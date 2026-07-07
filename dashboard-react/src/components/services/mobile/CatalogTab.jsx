import React, { useState, useMemo } from "react";
import { Form } from "react-bootstrap";
import { ArrowUpDown } from "lucide-react";
import ServiceCard from "./ServiceCard.jsx";

export default function CatalogTab({ state }) {
  const { servicesList } = state;
  const [sortBy, setSortBy] = useState("name-asc"); // "name-asc" | "price-asc" | "price-desc" | "duration-desc"

  // Sorted services list
  const sortedServices = useMemo(() => {
    const list = [...servicesList];
    if (sortBy === "name-asc") {
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (sortBy === "price-asc") {
      return list.sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    if (sortBy === "price-desc") {
      return list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    if (sortBy === "duration-desc") {
      return list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }
    return list;
  }, [servicesList, sortBy]);

  return (
    <div className="animate-fade-in">
      {/* List Header */}
      <div className="s-list-head">
        <h3 className="fw-black text-gray-900 m-0">Servicios ({sortedServices.length})</h3>
        
        <div className="s-sort">
          <ArrowUpDown size={14} className="text-muted" />
          <Form.Select
            size="sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-0 bg-transparent text-muted fw-bold px-1.5 py-0.5 cursor-pointer focus-ring-none"
            style={{ fontSize: "13px", width: "auto" }}
          >
            <option value="name-asc">Nombre A-Z</option>
            <option value="price-asc">Precio: Menor a mayor</option>
            <option value="price-desc">Precio: Mayor a menor</option>
            <option value="duration-desc">Duración</option>
          </Form.Select>
        </div>
      </div>

      {/* Services List Grid */}
      <div className="s-card bg-white p-2">
        {sortedServices.map(service => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            state={state}
          />
        ))}

        {sortedServices.length === 0 && (
          <div className="text-center py-5 text-muted smaller">
            No se encontraron servicios registrados con los filtros aplicados.
          </div>
        )}
      </div>
    </div>
  );
}
