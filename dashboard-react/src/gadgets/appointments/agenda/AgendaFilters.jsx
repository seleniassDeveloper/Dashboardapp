import React from "react";
import { Form, Row, Col, InputGroup } from "react-bootstrap";
import { Search, User, Briefcase, Tag, AlertTriangle } from "lucide-react";

export default function AgendaFilters({
  workers = [],
  services = [],
  filters,
  onChangeFilter,
}) {
  return (
    <div className="agenda-filters-row shadow-sm">
      <Row className="g-3">
        {/* Búsqueda Global */}
        <Col md={3}>
          <Form.Group>
            <Form.Label className="smaller text-muted fw-bold">Buscar Cliente</Form.Label>
            <InputGroup className="modern-input-group">
              <InputGroup.Text className="bg-transparent border-0 pe-0 text-muted">
                <Search size={14} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Nombre, email o tel..."
                value={filters.search}
                onChange={(e) => onChangeFilter("search", e.target.value)}
                className="bg-transparent border-0 py-1.5 shadow-none small"
                style={{ fontSize: "12.5px" }}
              />
            </InputGroup>
          </Form.Group>
        </Col>

        {/* Filtrar por Trabajador */}
        <Col md={2.5}>
          <Form.Group>
            <Form.Label className="smaller text-muted fw-bold">Filtrar por Estilista</Form.Label>
            <Form.Select
              value={filters.workerId}
              onChange={(e) => onChangeFilter("workerId", e.target.value)}
              className="modern-input"
              style={{ fontSize: "12.5px" }}
            >
              <option value="">Todos los profesionales</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.firstName} {w.lastName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Filtrar por Servicio */}
        <Col md={2.5}>
          <Form.Group>
            <Form.Label className="smaller text-muted fw-bold">Filtrar por Servicio</Form.Label>
            <Form.Select
              value={filters.serviceId}
              onChange={(e) => onChangeFilter("serviceId", e.target.value)}
              className="modern-input"
              style={{ fontSize: "12.5px" }}
            >
              <option value="">Todos los servicios</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Filtrar por Estado */}
        <Col md={2}>
          <Form.Group>
            <Form.Label className="smaller text-muted fw-bold">Estado de Cita</Form.Label>
            <Form.Select
              value={filters.status}
              onChange={(e) => onChangeFilter("status", e.target.value)}
              className="modern-input"
              style={{ fontSize: "12.5px" }}
            >
              <option value="">Todos los estados</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="PENDING">Pendiente</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="DONE">Finalizada</option>
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Filtrar por Seña */}
        <Col md={2} className="d-flex align-items-end">
          <Form.Group className="mb-2">
            <Form.Check
              type="checkbox"
              id="filter-no-sena"
              label="Ver solo sin seña"
              checked={filters.onlyNoSena}
              onChange={(e) => onChangeFilter("onlyNoSena", e.target.checked)}
              className="small fw-semibold text-danger cursor-pointer"
              style={{ fontSize: "12.5px" }}
            />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
}
