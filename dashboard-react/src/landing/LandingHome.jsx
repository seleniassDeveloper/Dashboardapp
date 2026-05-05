import React from "react";
import { Link } from "react-router-dom";

export default function LandingHome() {
  return (
    <div
      className="d-flex min-vh-100 align-items-center justify-content-center px-3"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(231, 146, 53, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(34, 84, 147, 0.12), transparent 50%), #f0eeea",
      }}
    >
      <div className="bg-white rounded-4 shadow p-4 p-md-5" style={{ width: "100%", maxWidth: 880 }}>
        <div className="row align-items-center g-4">
          <div className="col-lg-6">
            <div className="text-uppercase small fw-semibold text-muted mb-2">Dashboard + IA</div>
            <h1 className="display-6 fw-bold mb-3" style={{ lineHeight: 1.05 }}>
              Organiza tu negocio, clientes y tareas en un solo dashboard.
            </h1>
            <p className="text-muted mb-4">
              Gestiona citas, trabajadores, servicios, clientes y métricas desde una sola plataforma.
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Link to="/app" className="btn btn-warning fw-semibold px-4">
                Iniciar prueba
              </Link>
              <a href="#como-funciona" className="btn btn-outline-dark px-4">
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="border rounded-4 p-4 bg-light">
              <div className="fw-semibold mb-2">Qué vas a poder hacer</div>
              <ul className="mb-0 text-muted">
                <li>Ver calendario y lista de citas</li>
                <li>Administrar clientes y trabajadores</li>
                <li>Revisar métricas de rentabilidad y eficiencia</li>
                <li>Usar el asistente IA para reportes</li>
              </ul>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div id="como-funciona" className="row g-3">
          <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="fw-semibold mb-1">1) Entrá</div>
              <div className="text-muted small">Autenticación con Firebase (Google o correo/contraseña).</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="fw-semibold mb-1">2) Configurá tu marca</div>
              <div className="text-muted small">Nombre, imagen del header, colores y tipografía.</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="fw-semibold mb-1">3) Empezá a operar</div>
              <div className="text-muted small">Citas, estados, edición y seguimiento diario.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

