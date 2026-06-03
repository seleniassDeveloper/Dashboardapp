import React, { useState, useEffect, useRef, useMemo } from "react";
import { Row, Col, Card, Form, InputGroup, Button, Badge, Alert } from "react-bootstrap";
import { 
  Bot, Send, Sparkles, AlertTriangle, TrendingUp, 
  ArrowRight, MessageSquare, Compass, ShieldCheck 
} from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function InventoryAIInsights({ products = [], suppliers = [], movements = [], onTabChange }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "aura",
      text: "¡Hola! Soy Aura IA, tu copilot inteligente. He analizado en tiempo real tus existencias de Neon Cloud DB. ¿En qué puedo ayudarte a optimizar la rentabilidad de tu inventario hoy?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Dynamic Heuristic Advice Cards
  const adviceCards = useMemo(() => {
    const lowStock = products.filter(p => p.stock < p.minStock);
    const totalVal = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    const mappedProductIds = new Set(rules => rules?.map(r => r.productId) || []);
    
    // Check which products are not mapped to any consumption rules
    let unmappedCount = products.filter(p => !mappedProductIds.has(p.id)).length;

    const cards = [];

    // 1. Stock Status Advice
    if (lowStock.length > 0) {
      cards.push({
        id: "low-stock",
        title: "Peligro de Rotura de Stock",
        desc: `Detecté ${lowStock.length} insumos con stock por debajo del mínimo de seguridad. El producto más crítico es "${lowStock[0].name}" con sólo ${lowStock[0].stock} ${lowStock[0].unit}s en almacén.`,
        severity: "danger",
        actionText: "Reponer Existencias",
        tab: "productos",
        icon: AlertTriangle
      });
    } else {
      cards.push({
        id: "stock-ok",
        title: "Abastecimiento Óptimo",
        desc: "Felicitaciones. Todos tus insumos operativos se encuentran por encima del mínimo de seguridad establecido.",
        severity: "success",
        actionText: "Ver Catálogo",
        tab: "productos",
        icon: ShieldCheck
      });
    }

    // 2. Automations & Service Mapping Advice
    cards.push({
      id: "unmapped-rules",
      title: "Configuración de Fórmulas Técnicas",
      desc: "Al vincular tus insumos a tratamientos en las Reglas de Consumo, aseguras que el stock físico se descuente automáticamente en cada cita completada.",
      severity: "warning",
      actionText: "Mapear Consumos",
      tab: "reglas",
      icon: Compass
    });

    // 3. Capital Optimization Advice
    cards.push({
      id: "valuation-optimization",
      title: "Optimización de Capital de Trabajo",
      desc: `Tienes un capital inmovilizado en estanterías de ${currency(totalVal)}. Considera ajustar la frecuencia de compras de alta rotación para aumentar la liquidez diaria de caja.`,
      severity: "info",
      actionText: "Analizar Retornos (ROI)",
      tab: "rentabilidad",
      icon: TrendingUp
    });

    return cards;
  }, [products]);

  // Handle Quick Chips
  const handleQuickQuestion = (question) => {
    setInputText(question);
    submitQuestion(question);
  };

  // Submit User Message
  const submitQuestion = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: String(Date.now()),
      sender: "user",
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // AI logic response simulation referencing real db stats
    setTimeout(() => {
      let responseText = "";
      const q = query.toLowerCase();
      const lowStock = products.filter(p => p.stock < p.minStock);
      const totalVal = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

      if (q.includes("stock") || q.includes("bajo") || q.includes("mínimo") || q.includes("reponer") || q.includes("crítico")) {
        if (lowStock.length > 0) {
          const listStr = lowStock.map(p => `• ${p.name} (${p.stock}/${p.minStock} ${p.unit}s)`).join("\n");
          responseText = `Aura ha analizado tu inventario y detectó ${lowStock.length} insumos con stock crítico:\n\n${listStr}\n\nTe recomiendo pulsar el botón de 'Reponer Existencias' en las tarjetas de la izquierda para realizar una carga rápida de inventario.`;
        } else {
          responseText = "¡Todo excelente por aquí! No he detectado ningún producto por debajo del nivel mínimo. Tu inventario está cubierto.";
        }
      } else if (q.includes("valor") || q.includes("valuación") || q.includes("capital") || q.includes("cuesta") || q.includes("dinero")) {
        responseText = `La valuación contable de tus existencias físicas es de **${currency(totalVal)}** basado en sus costos de compra. Las categorías de mayor peso son Coloración y Lavado. Recomiendo una rotación rápida para evitar inmovilización financiera.`;
      } else if (q.includes("reglas") || q.includes("mapear") || q.includes("fórmula") || q.includes("automat")) {
        responseText = "Las fórmulas técnicas en 'Reglas de Consumo' te permiten descontar stock físico al instante cuando un profesional termina una cita. Esto te da precisión contable sin necesidad de conteos físicos diarios.";
      } else if (q.includes("proveedor") || q.includes("comprar")) {
        responseText = `Actualmente tienes ${suppliers.length} proveedores registrados. Recomiendo canalizar las reposiciones con tus proveedores principales de forma unificada para ahorrar en costes de envío.`;
      } else {
        responseText = `Entendido. He analizado tus ${products.length} productos y ${movements.length} movimientos de stock registrados. ¿Quieres que analicemos el plan de compras de insumos críticos, la rentabilidad por servicio o las reglas de descuento automático?`;
      }

      const aiMsg = {
        id: String(Date.now() + 1),
        sender: "aura",
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1100);
  };

  return (
    <div className="animate-fade-in">
      <Row className="g-4">
        {/* LEFT COLUMN: ACTIONABLE ADVICE CARDS */}
        <Col lg={5} className="d-flex flex-column gap-3.5">
          <div className="d-flex align-items-center gap-2 mb-1">
            <Sparkles className="text-purple-600 animate-pulse" size={20} />
            <h3 className="h6 fw-black text-gray-900 mb-0">Recomendaciones Inteligentes</h3>
          </div>
          
          {adviceCards.map((card) => {
            const Icon = card.icon;
            let themeClass = "bg-light";
            if (card.severity === "danger") themeClass = "bg-rose-50 border-rose-100";
            if (card.severity === "warning") themeClass = "bg-amber-50 border-amber-100";
            if (card.severity === "success") themeClass = "bg-emerald-50 border-emerald-100";
            
            return (
              <Card key={card.id} className={`card-premium border shadow-sm rounded-2xl p-3.5 ${themeClass}`}>
                <Card.Body className="p-0">
                  <div className="d-flex align-items-start gap-3">
                    <div className={`p-2.5 rounded-xl d-flex align-items-center justify-content-center ${
                      card.severity === "danger" ? "bg-rose-100 text-rose-700" :
                      card.severity === "warning" ? "bg-amber-100 text-amber-700" :
                      card.severity === "success" ? "bg-emerald-100 text-emerald-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      <Icon size={18} className={card.severity === "danger" ? "animate-pulse" : ""} />
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <h4 className="fw-black text-gray-900 small mb-1">{card.title}</h4>
                      <p className="text-muted smaller mb-3" style={{ lineHeight: "1.4" }}>
                        {card.desc}
                      </p>
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => onTabChange && onTabChange(card.tab)}
                        className="p-0 text-purple-600 hover-text-purple-800 fw-bold smaller d-inline-flex align-items-center gap-1 bg-transparent border-0 decoration-none"
                      >
                        <span>{card.actionText}</span>
                        <ArrowRight size={13} />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </Col>

        {/* RIGHT COLUMN: REDESIGNED COPILOT CHAT */}
        <Col lg={7}>
          <Card className="card-premium border shadow-sm bg-white rounded-2xl h-100 d-flex flex-column" style={{ minHeight: "480px" }}>
            {/* Header */}
            <div className="p-3.5 border-bottom bg-light bg-opacity-40 d-flex align-items-center justify-content-between rounded-t-2xl">
              <div className="d-flex align-items-center gap-2.5">
                <div className="p-2 bg-purple-600 text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "36px", height: "36px" }}>
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
              <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2.5 py-1.5 fw-bold" style={{ fontSize: "10.5px" }}>
                Copilot Activo
              </Badge>
            </div>

            {/* Chat Messages */}
            <div className="p-4 flex-grow-1 overflow-auto d-flex flex-column gap-3.5" style={{ maxHeight: "320px", minHeight: "260px" }}>
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`d-flex ${m.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
                >
                  <div 
                    className={`p-3 rounded-2xl shadow-sm smaller ${
                      m.sender === "user" 
                        ? "bg-purple-600 text-white rounded-tr-none" 
                        : "bg-light text-gray-800 rounded-tl-none border border-gray-100"
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
                  <div className="p-3 bg-light text-gray-600 rounded-2xl rounded-tl-none border border-gray-100 d-flex align-items-center gap-1.5 smaller">
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
            <div className="px-4 py-2.5 border-top bg-light bg-opacity-20 d-flex flex-wrap gap-2 align-items-center">
              <span className="smaller text-muted d-flex align-items-center gap-1 fw-semibold me-1">
                <MessageSquare size={12} /> Preguntas rápidas:
              </span>
              <button 
                onClick={() => handleQuickQuestion("¿Cuáles son los productos con bajo stock?")}
                className="btn btn-sm btn-outline-purple bg-white rounded-pill px-2.5 py-1.5 small fw-semibold shadow-sm"
                style={{ fontSize: "11px" }}
              >
                🔍 Productos Críticos
              </button>
              <button 
                onClick={() => handleQuickQuestion("¿Cuál es la valuación total del inventario?")}
                className="btn btn-sm btn-outline-purple bg-white rounded-pill px-2.5 py-1.5 small fw-semibold shadow-sm"
                style={{ fontSize: "11px" }}
              >
                💰 Valuación Almacén
              </button>
            </div>

            {/* Chat Input Form */}
            <div className="p-3 border-top rounded-b-2xl">
              <Form onSubmit={(e) => { e.preventDefault(); submitQuestion(); }}>
                <InputGroup>
                  <Form.Control
                    placeholder="Escribe tu consulta sobre stock, valuación, proveedores..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="rounded-l-xl border-gray-200 small"
                    disabled={isTyping}
                    style={{ height: "42px" }}
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
