import React from "react";
import { Card, Form, Row, Col } from "react-bootstrap";
import { useBrand } from "../../header/name/BrandProvider";
import { Scissors, Briefcase, CreditCard, GitBranch, Zap } from "lucide-react";

const MODULES_META = [
  {
    id: "services",
    label: "Servicios",
    desc: "Permite gestionar el catálogo de servicios, precios y duraciones del negocio.",
    icon: Scissors,
  },
  {
    id: "team",
    label: "Equipo / Personal",
    desc: "Administra a los profesionales, sus horarios y asignación de servicios.",
    icon: Briefcase,
  },
  {
    id: "finances",
    label: "Finanzas e Ingresos",
    desc: "Visualiza gráficos de facturación, caja diaria y análisis de ingresos.",
    icon: CreditCard,
  },
  {
    id: "workflows",
    label: "Workflows Personalizados",
    desc: "Define pantallas e interfaces intermedias en el flujo de trabajo.",
    icon: GitBranch,
  },
  {
    id: "automations",
    label: "Centro de Automatización",
    desc: "Configura notificaciones automáticas y recordatorios por WhatsApp o correo.",
    icon: Zap,
  },
];

export default function ActiveModulesEditor() {
  const { brand, setBrand } = useBrand();

  const handleToggle = (moduleId, active) => {
    setBrand((prev) => ({
      ...prev,
      activeModules: {
        ...(prev.activeModules || {}),
        [moduleId]: active,
      },
    }));
  };

  return (
    <Card className="card-premium border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="mb-4">
          <h2 className="h5 fw-bold mb-1">Módulos Activos</h2>
          <p className="text-muted small mb-0">
            Habilitá o deshabilitá las secciones que tu negocio necesita. Los cambios se aplicarán instantáneamente en el menú lateral y las rutas.
          </p>
        </div>

        <Row className="g-3">
          {MODULES_META.map((mod) => {
            const Icon = mod.icon;
            const isChecked = brand.activeModules?.[mod.id] ?? true;

            return (
              <Col md={12} key={mod.id}>
                <div className="p-3 border rounded-3 d-flex align-items-center justify-content-between hover-scale bg-white">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-xl bg-light text-primary">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="h6 fw-bold mb-1">{mod.label}</h3>
                      <p className="text-muted small mb-0" style={{ maxWidth: "480px" }}>
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                  <Form.Check
                    type="switch"
                    id={`module-switch-${mod.id}`}
                    checked={isChecked}
                    onChange={(e) => handleToggle(mod.id, e.target.checked)}
                    style={{ cursor: "pointer", width: "40px" }}
                    aria-label={`Toggle module ${mod.label}`}
                  />
                </div>
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  );
}
