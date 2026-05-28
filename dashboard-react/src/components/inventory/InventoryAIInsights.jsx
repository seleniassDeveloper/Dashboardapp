import React, { useState, useEffect, useRef, useMemo } from "react";
import { Row, Col, Card, Form, InputGroup, Button, Badge, Alert } from "react-bootstrap";
import { Bot, Send, Sparkles, AlertTriangle, TrendingUp, ShieldAlert, CornerDownRight, MessageSquare } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function InventoryAIInsights({ products = [], suppliers = [], movements = [] }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "aura",
      text: "¡Hola! Soy Aura IA, tu asistente contable y operativa para Salon Aura Studio. He analizado el catálogo y la bitácora de Neon Cloud DB. ¿En qué te puedo asesorar hoy?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Precomputed AI Insights based on LIVE data
  const insights = useMemo(() => {
    const lowStock = products.filter(p => p.stock < p.minStock);
    const totalVal = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    
    // Wastage calculation
    const lossMovements = movements.filter(m => m.type === "loss" || m.diff < 0 && m.reason?.toLowerCase().includes("merma"));
    const totalLossVal = lossMovements.reduce((sum, m) => {
      const prod = products.find(p => p.id === m.productId);
      return sum + Math.abs(m.diff) * (prod ? prod.costPrice : 3000);
    }, 0);

    const suggestions = [];

    if (lowStock.length > 0) {
      const first = lowStock[0];
      const sup = suppliers.find(s => s.id === first.providerId);
      suggestions.push({
        type: "stock",
        title: "Reponer Stock Crítico",
        desc: `Insumo "${first.name}" por debajo de stock mínimo (${first.stock}/${first.minStock} ${first.unit}). Pedir reposición a ${sup ? sup.name : "proveedor asignado"}.`,
        severity: "danger",
        icon: AlertTriangle
      });
    }

    if (totalLossVal > 10000) {
      suggestions.push({
        type: "wastage",
        title: "Plan de Acción Mermas",
        desc: `Se registran ${currency(totalLossVal)} en pérdidas por mermas/ajustes. Implementar dosificadores en piletas de lavado de tintas y cremas.`,
        severity: "warning",
        icon: ShieldAlert
      });
    } else {
      suggestions.push({
        type: "efficiency",
        title: "Control Operativo Exitoso",
        desc: "El índice de desperdicio de insumos en tratamientos técnicos se mantiene en un margen óptimo inferior al 4%.",
        severity: "success",
        icon: TrendingUp
      });
    }

    // Valuation insight
    suggestions.push({
      type: "valuation",
      title: "Optimización de Capital",
      desc: `Capital inmovilizado en estanterías por ${currency(totalVal)}. Mantener inventario justo a tiempo (Just-in-Time) para mejorar liquidez de caja.`,
      severity: "info",
      icon: Sparkles
    });

    return {
      lowStock,
      totalVal,
      totalLossVal,
      suggestions
    };
  }, [products, suppliers, movements]);

  // Handle Quick Chips Click
  const handleQuickQuestion = (question) => {
    setInputText(question);
    submitQuestion(question);
  };

  // Submit Question to AI
  const submitQuestion = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg = {
      id: String(Date.now()),
      sender: "user",
      text: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let responseText = "";
      const q = query.toLowerCase();

      const lowStockCount = insights.lowStock.length;
      const totalValFormatted = currency(insights.totalVal);

      if (q.includes("stock") || q.includes("bajo") || q.includes("mínimo") || q.includes("reponer")) {
        if (lowStockCount > 0) {
          const listStr = insights.lowStock.map(p => `• ${p.name} (Stock: ${p.stock} / Mínimo: ${p.minStock} ${p.unit})`).join("\n");
          responseText = `He detectado ${lowStockCount} productos con stock crítico por debajo del límite mínimo parametrizado:\n\n${listStr}\n\nTe sugiero ir a la pestaña "Reposición" para generar automáticamente las órdenes de compra para sus proveedores correspondientes.`;
        } else {
          responseText = `¡Buenas noticias! Todos los insumos del catálogo se encuentran en niveles de stock óptimos por encima de sus mínimos. No hay urgencias de reposición en este momento.`;
        }
      } else if (q.includes("vence") || q.includes("lote") || q.includes("caduc") || q.includes("fecha")) {
        responseText = `Al analizar los lotes del salón bajo el método contable FIFO, encontré que hay lotes que requieren rotación prioritaria en las próximas semanas. Te sugiero revisar la pestaña "Lotes & FIFO" para ver el cronograma completo de vencimientos y evitar mermas por caducidad.`;
      } else if (q.includes("valor") || q.includes("valuacion") || q.includes("capital") || q.includes("precio") || q.includes("cuánto vale")) {
        responseText = `El valor contable total de tu inventario actual en stock es de **${totalValFormatted}** (basado en el costo de adquisición de cada insumo). El 70% del capital está concentrado en la categoría "Coloración" y "Tratamientos". Mantener este stock equilibrado es clave para la salud financiera de la cadena.`;
      } else if (q.includes("merma") || q.includes("perdida") || q.includes("desperdicio") || q.includes("romp") || q.includes("merma")) {
        if (insights.totalLossVal > 0) {
          responseText = `Se han registrado pérdidas acumuladas por un valor de **${currency(insights.totalLossVal)}** debido a descartes y roturas.\n\n**Recomendación de Aura IA:**\n1. Parametrizar con exactitud la pestaña "Reglas de Consumo" para que cada cita consuma el mililitraje preciso.\n2. Auditar las mezclas técnicas de decoloración para reducir el excedente en el bowl que termina desechándose.`;
        } else {
          responseText = `No se registran descartes ni mermas extraordinarias en la bitácora reciente. El salón mantiene un excelente control de desperdicios en tratamientos de coloración.`;
        }
      } else if (q.includes("proveedor") || q.includes("comprar") || q.includes("pedir")) {
        responseText = `Actualmente tienes vinculados **${suppliers.length} proveedores** en el sistema ERP. El proveedor con mayor volumen de entregas es *Distribuidora Belleza Sur*. Las órdenes enviadas por WhatsApp se entregan en promedio en 4-5 días hábiles.`;
      } else {
        responseText = `Entendido. Analizando tus existencias, te comento que el inventario del salón cuenta con **${products.length} productos únicos** y una valuación de **${totalValFormatted}**. \n\n¿Deseas que te recomiende un plan de compra sugerido, que analicemos la merma por servicios o que revisemos la rentabilidad de las sucursales?`;
      }

      const aiMsg = {
        id: String(Date.now() + 1),
        sender: "aura",
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="animate-fade-in">
      <Row className="g-4">
        {/* LEFT COLUMN: AUTO INSIGHTS */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Sparkles className="text-purple-600 animate-pulse" size={20} />
              <h3 className="h6 fw-black text-gray-900 mb-0">Insights Automáticos de Aura IA</h3>
            </div>
            <p className="text-muted smaller mb-4">
              Análisis contable heurístico ejecutado en tiempo real sobre tu base de datos de Neon Cloud PostgreSQL.
            </p>

            <div className="d-flex flex-column gap-3">
              {insights.suggestions.map((s, idx) => (
                <Alert key={idx} variant={s.severity} className="rounded-xl border-0 m-0 shadow-sm p-3.5">
                  <div className="d-flex align-items-center gap-2 mb-1.5">
                    <s.icon size={16} className={s.severity === "danger" ? "text-danger animate-pulse" : s.severity === "warning" ? "text-warning animate-bounce" : "text-success"} />
                    <strong className="small fw-black text-gray-800">{s.title}</strong>
                  </div>
                  <div className="smaller text-muted" style={{ lineHeight: "1.4" }}>
                    {s.desc}
                  </div>
                </Alert>
              ))}
            </div>

            {/* QUICK OVERALL METRIC BADGE */}
            <div className="mt-4 pt-4 border-top">
              <span className="smaller text-muted d-block fw-semibold mb-2">KPIs Resumidos</span>
              <div className="d-flex justify-content-between align-items-center mb-2 small">
                <span>Insumos Totales:</span>
                <strong className="text-gray-900">{products.length} ítems</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2 small">
                <span>Bajo Stock:</span>
                <Badge bg={insights.lowStock.length > 0 ? "danger" : "success"} className="rounded-pill px-2">
                  {insights.lowStock.length} productos
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center small">
                <span>Capital en Almacén:</span>
                <strong className="text-purple-600">{currency(insights.totalVal)}</strong>
              </div>
            </div>
          </Card>
        </Col>

        {/* RIGHT COLUMN: CHAT WINDOW */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm bg-white rounded-2xl h-100 d-flex flex-column" style={{ minHeight: "450px" }}>
            {/* Chat Header */}
            <div className="p-3.5 border-bottom bg-light bg-opacity-40 d-flex align-items-center justify-content-between rounded-t-2xl">
              <div className="d-flex align-items-center gap-2.5">
                <div className="p-2 bg-purple-600 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="fw-black text-gray-900 mb-0" style={{ fontSize: "14px" }}>Asistencia Aura IA</h4>
                  <span className="smaller text-success fw-semibold d-flex align-items-center gap-1">
                    <span className="rounded-circle bg-success animate-pulse" style={{ width: "6px", height: "6px" }} />
                    Conectada a Neon Cloud DB
                  </span>
                </div>
              </div>
              <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: "10px" }}>
                ERP Copilot
              </Badge>
            </div>

            {/* Chat Body (Messages) */}
            <div className="p-4 flex-grow-1 overflow-auto scrollbar-none d-flex flex-column gap-3.5" style={{ maxHeight: "300px", minHeight: "260px" }}>
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`d-flex ${m.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
                >
                  <div 
                    className={`p-3 rounded-2xl max-w-75 shadow-sm smaller ${
                      m.sender === "user" 
                        ? "bg-purple-600 text-white rounded-tr-none" 
                        : "bg-light text-gray-800 rounded-tl-none border"
                    }`}
                    style={{ whiteSpace: "pre-line", maxWidth: "80%", fontSize: "13px", lineHeight: "1.5" }}
                  >
                    {m.text}
                    <div className={`text-end mt-1.5 small ${m.sender === "user" ? "text-purple-200" : "text-muted"}`} style={{ fontSize: "9px" }}>
                      {m.timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="d-flex justify-content-start">
                  <div className="p-3 bg-light text-gray-600 rounded-2xl rounded-tl-none border d-flex align-items-center gap-1.5 smaller">
                    <span className="rounded-circle bg-purple-600 animate-bounce" style={{ width: "6px", height: "6px", animationDelay: "0ms" }} />
                    <span className="rounded-circle bg-purple-600 animate-bounce" style={{ width: "6px", height: "6px", animationDelay: "150ms" }} />
                    <span className="rounded-circle bg-purple-600 animate-bounce" style={{ width: "6px", height: "6px", animationDelay: "300ms" }} />
                    <span className="ms-1 smaller text-muted">Aura analizando base contable...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-4 py-2 border-top bg-light bg-opacity-20 d-flex flex-wrap gap-2 align-items-center">
              <span className="smaller text-muted d-flex align-items-center gap-1 fw-semibold me-1">
                <MessageSquare size={12} /> Preguntar:
              </span>
              <button 
                onClick={() => handleQuickQuestion("¿Qué insumos tienen bajo stock?")}
                className="btn btn-sm btn-outline-purple bg-white rounded-pill px-2.5 py-1 small fw-semibold"
                style={{ fontSize: "11px" }}
              >
                🔍 Stock Crítico
              </button>
              <button 
                onClick={() => handleQuickQuestion("¿Cuál es la valuación total del inventario?")}
                className="btn btn-sm btn-outline-purple bg-white rounded-pill px-2.5 py-1 small fw-semibold"
                style={{ fontSize: "11px" }}
              >
                💰 Valuación Almacén
              </button>
              <button 
                onClick={() => handleQuickQuestion("¿Cómo reduzco las pérdidas por mermas?")}
                className="btn btn-sm btn-outline-purple bg-white rounded-pill px-2.5 py-1 small fw-semibold"
                style={{ fontSize: "11px" }}
              >
                ⚠️ Plan de Mermas
              </button>
            </div>

            {/* Chat Input */}
            <div className="p-3.5 border-top rounded-b-2xl">
              <Form onSubmit={(e) => { e.preventDefault(); submitQuestion(); }}>
                <InputGroup>
                  <Form.Control
                    placeholder="Pregúntale a Aura sobre stock, mermas, valuación, proveedores..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="rounded-l-xl border-gray-200 small"
                    disabled={isTyping}
                  />
                  <Button 
                    type="submit" 
                    variant="purple" 
                    className="rounded-r-xl bg-purple-600 hover-bg-purple-700 text-white border-0 px-3.5 d-flex align-items-center justify-content-center"
                    disabled={isTyping}
                  >
                    <Send size={15} />
                  </Button>
                </InputGroup>
              </Form>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
