import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api.js";
import BookingForm from "./BookingForm.jsx";

export default function BookingPage() {
  const { businessSlug, slug: routeSlug } = useParams();
  const slug = businessSlug || routeSlug || window.location.pathname.split("/")[2] || "mi-negocio";

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBusiness() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE_URL}/public/business/${slug}`);
        if (!res.ok) {
          throw new Error("No se pudo obtener la información de este negocio.");
        }
        const data = await res.json();
        setBusiness(data);
      } catch (err) {
        console.error("Error fetching business:", err);
        setError(err.message || "Error al cargar la página de reserva.");
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [slug]);

  // Dynamic branding variables
  const brandColor = business?.bookingPrimaryColor || "#7c3aed";

  return (
    <div
      style={{
        "--brand-color": brandColor,
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "20px 10px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: "#1e293b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');
        
        .booking-container {
          width: 100%;
          max-width: 580px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          border: 1px solid #f1f5f9;
          overflow: hidden;
          padding: 24px;
          margin-top: 15px;
          margin-bottom: 80px;
        }

        .skeleton-block {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: loading-pulse 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes loading-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .brand-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--brand-color);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .brand-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, var(--brand-color) 0%, #1e293b 100%);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
      `}</style>

      {/* HEADER: LOGO AND BUSINESS TITLE */}
      <header
        style={{
          width: "100%",
          maxWidth: "580px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 5px",
          marginBottom: "10px"
        }}
      >
        <div style={{ display: "flex", translate: "no", alignItems: "center", gap: "12px" }}>
          {loading ? (
            <div className="skeleton-block" style={{ width: "48px", height: "48px", borderRadius: "50%" }} />
          ) : business?.logo ? (
            <img src={business.logo} alt="Logo" className="brand-avatar" />
          ) : (
            <div className="brand-avatar-placeholder">
              {business?.name?.substring(0, 2).toUpperCase() || "AZ"}
            </div>
          )}
          
          <div>
            {loading ? (
              <div className="skeleton-block" style={{ width: "120px", height: "20px", marginBottom: "6px" }} />
            ) : (
              <h1 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
                {business?.name}
              </h1>
            )}
            
            {loading ? (
              <div className="skeleton-block" style={{ width: "80px", height: "12px" }} />
            ) : (
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {business?.description || "Reservas Online"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* SKELETON LOADER STATE */}
      {loading && (
        <div className="booking-container d-grid gap-4">
          <div className="skeleton-block" style={{ height: "4px", width: "100%", borderRadius: "10px" }} />
          <div className="skeleton-block" style={{ height: "40px", width: "70%", margin: "0 auto 10px" }} />
          <div className="skeleton-block" style={{ height: "80px", width: "100%" }} />
          <div className="skeleton-block" style={{ height: "80px", width: "100%" }} />
          <div className="skeleton-block" style={{ height: "80px", width: "100%" }} />
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div 
          className="booking-container"
          style={{
            textAlign: "center",
            padding: "40px 20px"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#ef4444", marginBottom: "10px" }}>
            Negocio no Encontrado
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", marginBottom: "0" }}>
            {error}
          </p>
        </div>
      )}

      {/* BOOKING WIZARD FORM */}
      {!loading && !error && business && (
        <div className="booking-container">
          <BookingForm business={business} slug={slug} />
        </div>
      )}
    </div>
  );
}
