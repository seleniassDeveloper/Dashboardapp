import prisma from "../prisma.js";

// Helper to seed initial products & suppliers if catalog is empty
async function seedInventoryIfNeeded() {
  try {
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      // 1. Seed default suppliers
      const supplier1 = await prisma.supplier.create({
        data: {
          name: "Distribuidora Belleza Sur",
          contactName: "Roberto Gomez",
          phone: "11-3420-9981",
          email: "roberto@bellezasur.com",
          address: "Av. Mitre 450, Avellaneda",
          paymentTerms: "30 días",
          avgDeliveryDays: 5
        }
      });

      const supplier2 = await prisma.supplier.create({
        data: {
          name: "L'Oreal Express",
          contactName: "Mariela Alvarez",
          phone: "11-9872-4321",
          email: "pedidos@lorealexpress.com.ar",
          address: "Gallo 1200, CABA",
          paymentTerms: "Contado",
          avgDeliveryDays: 3
        }
      });

      const supplier3 = await prisma.supplier.create({
        data: {
          name: "Manicura Pro",
          contactName: "Gabriela Sola",
          phone: "11-5401-2299",
          email: "ventas@manicurapro.com",
          address: "Florida 300, CABA",
          paymentTerms: "30 días",
          avgDeliveryDays: 4
        }
      });

      // 2. Seed products
      const p1 = await prisma.product.create({
        data: {
          name: "Tinta L'Oreal Majirel 7.1",
          category: "Coloración",
          costPrice: 4500,
          salePrice: 9000,
          stock: 3,
          minStock: 8,
          maxStock: 20,
          unit: "unidad",
          location: "Estante Color A1",
          providerId: supplier1.id,
          barcode: "7790123456789",
          color: "violet",
          icon: "brush",
          label: "Tinte"
        }
      });

      const p2 = await prisma.product.create({
        data: {
          name: "Shampoo PH Neutro Premium 5L",
          category: "Lavado",
          costPrice: 12000,
          salePrice: 24000,
          stock: 1,
          minStock: 3,
          maxStock: 8,
          unit: "litro",
          location: "Depósito Lavado",
          providerId: supplier2.id,
          barcode: "7790987654321",
          color: "blue",
          icon: "droplet",
          label: "Shampoo"
        }
      });

      const p3 = await prisma.product.create({
        data: {
          name: "Keratina Hidrolizada 1L",
          category: "Tratamientos",
          costPrice: 28000,
          salePrice: 45000,
          stock: 6,
          minStock: 5,
          maxStock: 15,
          unit: "litro",
          location: "Estante Tratamientos B2",
          providerId: supplier1.id,
          barcode: "7791112223334",
          color: "emerald",
          icon: "sparkles",
          label: "Keratina"
        }
      });

      const p4 = await prisma.product.create({
        data: {
          name: "Esmalte Meliné Semipermanente",
          category: "Manicuría",
          costPrice: 3200,
          salePrice: 5800,
          stock: 14,
          minStock: 5,
          maxStock: 30,
          unit: "unidad",
          location: "Caja Manicuría Estante C",
          providerId: supplier3.id,
          barcode: "7794445556667",
          color: "pink",
          icon: "flower",
          label: "Esmalte"
        }
      });

      const p5 = await prisma.product.create({
        data: {
          name: "Crema Oxidante 20 Vol 1L",
          category: "Coloración",
          costPrice: 6500,
          salePrice: 11000,
          stock: 2,
          minStock: 4,
          maxStock: 10,
          unit: "litro",
          location: "Estante Color A2",
          providerId: supplier1.id,
          barcode: "7797778889990",
          color: "cyan",
          icon: "flask",
          label: "Oxidante"
        }
      });

      // 3. Seed default batches to support FIFO
      const branches = await prisma.branch.findMany();
      const defaultBranchId = branches[0]?.id || null;

      const productsList = [p1, p2, p3, p4, p5];
      for (const p of productsList) {
        await prisma.productBatch.create({
          data: {
            productId: p.id,
            batchNumber: `LOTE-${Math.floor(1000 + Math.random() * 9000)}`,
            supplierId: p.providerId,
            initialQty: p.stock,
            actualQty: p.stock,
            costPrice: p.costPrice,
            branchId: defaultBranchId,
            expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 days expiration
          }
        });

        // Initialize branch inventories
        for (const b of branches) {
          await prisma.branchInventory.create({
            data: {
              productId: p.id,
              branchId: b.id,
              stock: b.id === defaultBranchId ? p.stock : 0,
              minStock: p.minStock,
              idealStock: p.maxStock
            }
          });
        }

        // Initialize legacy movements
        await prisma.stockMovement.create({
          data: {
            productId: p.id,
            prevQty: 0,
            newQty: p.stock,
            diff: p.stock,
            type: "input",
            reason: "Inventario inicial",
            user: "Admin Aura Studio",
            branchId: defaultBranchId
          }
        });
      }

      // 4. Seed default service consumption rules if services exist
      const services = await prisma.service.findMany();
      const coloracion = services.find(s => s.name.toLowerCase().includes("color"));
      const keratina = services.find(s => s.name.toLowerCase().includes("keratina") || s.name.toLowerCase().includes("tratamiento"));
      const manicuria = services.find(s => s.name.toLowerCase().includes("manicur"));

      if (coloracion) {
        await prisma.serviceConsumptionRule.create({
          data: { serviceId: coloracion.id, productId: p1.id, quantity: 1 } // 1 tubo
        });
        await prisma.serviceConsumptionRule.create({
          data: { serviceId: coloracion.id, productId: p5.id, quantity: 100 } // 100 ml
        });
      }
      if (keratina) {
        await prisma.serviceConsumptionRule.create({
          data: { serviceId: keratina.id, productId: p3.id, quantity: 50 } // 50 ml
        });
      }
      if (manicuria) {
        await prisma.serviceConsumptionRule.create({
          data: { serviceId: manicuria.id, productId: p4.id, quantity: 1 } // 1 esmalte (uso conceptual)
        });
      }

      console.log("Inventario ERP auto-seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding inventory ERP:", err);
  }
}

// GET /api/inventory/dashboard
export async function getInventoryDashboardData(req, res) {
  try {
    await seedInventoryIfNeeded();

    const products = await prisma.product.findMany({
      include: { provider: true }
    });

    // 1. Calculations
    const lowStockProducts = products.filter(p => p.stock < p.minStock);
    const lowStockCount = lowStockProducts.length;

    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    const totalUnique = products.length;

    // Estimate consumption (monthly estimate based on total treatments done)
    const appointmentsCount = await prisma.appointment.count({
      where: { status: "DONE" }
    });
    const estimatedMonthlySpend = 15000 + (appointmentsCount * 1200);

    // Most consumed product
    const mostConsumed = products.sort((a, b) => b.stock - a.stock)[0]?.name || "Tintas Loreal";

    return res.status(200).json({
      summary: {
        lowStockCount,
        totalValue,
        totalUnique,
        estimatedMonthlySpend,
        mostConsumed,
        costliestService: "Balayage Premium"
      }
    });
  } catch (error) {
    console.error("Error in getInventoryDashboardData:", error);
    return res.status(500).json({ error: "Error calculando métricas de inventario." });
  }
}

// GET /api/inventory/products & CRUD
export async function listProducts(req, res) {
  try {
    await seedInventoryIfNeeded();
    const list = await prisma.product.findMany({
      include: { provider: true, branchInventories: { include: { branch: true } }, batches: true },
      orderBy: { name: "asc" }
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error("Error listing products:", error);
    return res.status(500).json({ error: "Error leyendo catálogo de productos." });
  }
}

export async function createProduct(req, res) {
  try {
    const {
      name, category, costPrice, salePrice, stock, minStock, maxStock, unit, barcode, location, providerId, color, icon, label,
      sku, description, weight, volume, dimensions, taxRate, leadTimeDays, supplierSku, requireExpiration, requireBatch
    } = req.body;
    if (!name || costPrice === undefined || minStock === undefined) {
      return res.status(400).json({ error: "Campos requeridos: name, costPrice, minStock." });
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        costPrice: Number(costPrice),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock || 0),
        minStock: Number(minStock),
        maxStock: maxStock ? Number(maxStock) : 10,
        unit: unit || "unidad",
        barcode: barcode || null,
        location: location || null,
        providerId: providerId || null,
        color: color || null,
        icon: icon || null,
        label: label || null,
        sku: sku || null,
        description: description || null,
        weight: (weight !== undefined && weight !== "" && weight !== null) ? Number(weight) : null,
        volume: (volume !== undefined && volume !== "" && volume !== null) ? Number(volume) : null,
        dimensions: dimensions || null,
        taxRate: (taxRate !== undefined && taxRate !== "" && taxRate !== null) ? Number(taxRate) : 0,
        leadTimeDays: (leadTimeDays !== undefined && leadTimeDays !== "" && leadTimeDays !== null) ? Math.round(Number(leadTimeDays)) : 0,
        supplierSku: supplierSku || null,
        requireExpiration: requireExpiration !== undefined ? Boolean(requireExpiration) : false,
        requireBatch: requireBatch !== undefined ? Boolean(requireBatch) : false
      },
      include: { provider: true }
    });

    // Initialize branch inventories
    const branches = await prisma.branch.findMany();
    const firstBranchId = branches[0]?.id || null;
    for (const b of branches) {
      await prisma.branchInventory.create({
        data: {
          productId: product.id,
          branchId: b.id,
          stock: b.id === firstBranchId ? Number(stock || 0) : 0,
          minStock: Number(minStock),
          idealStock: maxStock ? Number(maxStock) : 10
        }
      });
    }

    // Initialize default batch
    if (Number(stock || 0) > 0) {
      await prisma.productBatch.create({
        data: {
          productId: product.id,
          batchNumber: `LOTE-NEW-${Math.floor(100 + Math.random() * 900)}`,
          initialQty: Number(stock),
          actualQty: Number(stock),
          costPrice: Number(costPrice),
          branchId: firstBranchId,
          supplierId: providerId || null,
          expirationDate: requireExpiration ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null
        }
      });

      // Audit movement
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          prevQty: 0,
          newQty: Number(product.stock),
          diff: Number(product.stock),
          type: "input",
          reason: "Carga inicial de producto",
          branchId: firstBranchId
        }
      });
    }

    return res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Error creando producto en catálogo." });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name, category, costPrice, salePrice, stock, minStock, maxStock, unit, barcode, location, providerId, color, icon, label,
      sku, description, weight, volume, dimensions, taxRate, leadTimeDays, supplierSku, requireExpiration, requireBatch
    } = req.body;

    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: "Producto no encontrado." });

    const prevStock = current.stock;
    const newStockVal = stock !== undefined ? Number(stock) : prevStock;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
        salePrice: salePrice !== undefined ? (salePrice ? Number(salePrice) : null) : undefined,
        stock: newStockVal,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        maxStock: maxStock !== undefined ? Number(maxStock) : undefined,
        unit,
        barcode,
        location,
        providerId: providerId || null,
        color: color !== undefined ? color : undefined,
        icon: icon !== undefined ? icon : undefined,
        label: label !== undefined ? label : undefined,
        sku: sku !== undefined ? (sku || null) : undefined,
        description: description !== undefined ? (description || null) : undefined,
        weight: weight !== undefined ? ((weight !== "" && weight !== null) ? Number(weight) : null) : undefined,
        volume: volume !== undefined ? ((volume !== "" && volume !== null) ? Number(volume) : null) : undefined,
        dimensions: dimensions !== undefined ? (dimensions || null) : undefined,
        taxRate: taxRate !== undefined ? ((taxRate !== "" && taxRate !== null) ? Number(taxRate) : 0) : undefined,
        leadTimeDays: leadTimeDays !== undefined ? ((leadTimeDays !== "" && leadTimeDays !== null) ? Math.round(Number(leadTimeDays)) : 0) : undefined,
        supplierSku: supplierSku !== undefined ? (supplierSku || null) : undefined,
        requireExpiration: requireExpiration !== undefined ? Boolean(requireExpiration) : undefined,
        requireBatch: requireBatch !== undefined ? Boolean(requireBatch) : undefined
      },
      include: { provider: true }
    });

    // Create adjustment log if stock was edited manually
    if (newStockVal !== prevStock) {
      const diff = newStockVal - prevStock;
      const branches = await prisma.branch.findMany();
      const firstBranchId = branches[0]?.id || null;

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          prevQty: prevStock,
          newQty: newStockVal,
          diff: diff,
          type: diff > 0 ? "input" : "adjustment",
          reason: "Ajuste manual de stock por ficha técnica",
          branchId: firstBranchId
        }
      });

      // Adjust the branch inventory correspondingly
      if (firstBranchId) {
        await prisma.branchInventory.updateMany({
          where: { productId: product.id, branchId: firstBranchId },
          data: { stock: newStockVal }
        });
      }
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Error editando producto." });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Error eliminando producto." });
  }
}

// GET /api/inventory/suppliers & CRUD
export async function listSuppliers(req, res) {
  try {
    const list = await prisma.supplier.findMany({
      include: { products: true },
      orderBy: { name: "asc" }
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error("Error listing suppliers:", error);
    return res.status(500).json({ error: "Error listando proveedores." });
  }
}

export async function createSupplier(req, res) {
  try {
    const { name, contactName, phone, email, address, paymentTerms, avgDeliveryDays } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre obligatorio." });

    const s = await prisma.supplier.create({
      data: {
        name,
        contactName,
        phone,
        email,
        address,
        paymentTerms,
        avgDeliveryDays: avgDeliveryDays ? Number(avgDeliveryDays) : 7
      }
    });
    return res.status(201).json(s);
  } catch (error) {
    console.error("Error creating supplier:", error);
    return res.status(500).json({ error: "Error creando proveedor." });
  }
}

export async function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const { name, contactName, phone, email, address, paymentTerms, avgDeliveryDays } = req.body;

    const s = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactName,
        phone,
        email,
        address,
        paymentTerms,
        avgDeliveryDays: avgDeliveryDays ? Number(avgDeliveryDays) : undefined
      }
    });
    return res.status(200).json(s);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return res.status(500).json({ error: "Error editando proveedor." });
  }
}

export async function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return res.status(500).json({ error: "Error al borrar proveedor." });
  }
}

// GET /api/inventory/movements & creation
export async function listMovements(req, res) {
  try {
    const list = await prisma.stockMovement.findMany({
      include: { product: true, branch: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error("Error listing movements:", error);
    return res.status(500).json({ error: "Error cargando bitácora." });
  }
}

export async function createMovement(req, res) {
  try {
    const { productId, diff, type, reason, observation, branchId } = req.body;
    if (!productId || diff === undefined || !type) {
      return res.status(400).json({ error: "Campos productId, diff, type requeridos." });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Producto no existe." });

    const prevQty = product.stock;
    const newQty = prevQty + Number(diff) >= 0 ? prevQty + Number(diff) : 0;
    const realDiff = newQty - prevQty;

    // Update global stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newQty }
    });

    // Update Branch Stock if branchId is provided
    if (branchId) {
      const bi = await prisma.branchInventory.findUnique({
        where: { productId_branchId: { productId, branchId } }
      });
      if (bi) {
        await prisma.branchInventory.update({
          where: { id: bi.id },
          data: { stock: Math.max(0, bi.stock + realDiff) }
        });
      } else {
        await prisma.branchInventory.create({
          data: { productId, branchId, stock: Math.max(0, realDiff) }
        });
      }
    }

    // Register movement log
    const mov = await prisma.stockMovement.create({
      data: {
        productId,
        prevQty,
        newQty,
        diff: realDiff,
        type,
        reason,
        observation,
        branchId: branchId || null
      },
      include: { product: true }
    });

    return res.status(201).json(mov);
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return res.status(500).json({ error: "Error registrando movimiento de inventario." });
  }
}

// GET /api/inventory/batches & creation
export async function listBatches(req, res) {
  try {
    const list = await prisma.productBatch.findMany({
      include: { product: true, supplier: true, branch: true },
      orderBy: { expirationDate: "asc" }
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error("Error listing batches:", error);
    return res.status(500).json({ error: "Error listando lotes." });
  }
}

export async function createBatch(req, res) {
  try {
    const { productId, batchNumber, supplierId, initialQty, expirationDate, costPrice, branchId } = req.body;
    if (!productId || !batchNumber || initialQty === undefined || costPrice === undefined) {
      return res.status(400).json({ error: "Campos requeridos: productId, batchNumber, initialQty, costPrice." });
    }

    const batch = await prisma.productBatch.create({
      data: {
        productId,
        batchNumber,
        supplierId: supplierId || null,
        initialQty: Number(initialQty),
        actualQty: Number(initialQty),
        costPrice: Number(costPrice),
        branchId: branchId || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null
      },
      include: { product: true }
    });

    // Update product stock immediately
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      const prevStock = product.stock;
      const newStock = prevStock + Number(initialQty);

      await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });

      // Update branch stock
      if (branchId) {
        const bi = await prisma.branchInventory.findUnique({
          where: { productId_branchId: { productId, branchId } }
        });
        if (bi) {
          await prisma.branchInventory.update({
            where: { id: bi.id },
            data: { stock: bi.stock + Number(initialQty) }
          });
        }
      }

      // Log movement
      await prisma.stockMovement.create({
        data: {
          productId,
          prevQty: prevStock,
          newQty: newStock,
          diff: Number(initialQty),
          type: "input",
          reason: `Ingreso de lote nuevo: ${batchNumber}`,
          branchId: branchId || null
        }
      });
    }

    return res.status(201).json(batch);
  } catch (error) {
    console.error("Error creating batch:", error);
    return res.status(500).json({ error: "Error al crear lote contable." });
  }
}

// GET /api/inventory/rules & CRUD
export async function listRules(req, res) {
  try {
    const list = await prisma.serviceConsumptionRule.findMany({
      include: { service: true, product: true }
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error("Error listing rules:", error);
    return res.status(500).json({ error: "Error listando reglas de consumo." });
  }
}

export async function createRule(req, res) {
  try {
    const { serviceId, productId, quantity } = req.body;
    if (!serviceId || !productId || !quantity) {
      return res.status(400).json({ error: "Parámetros serviceId, productId y quantity obligatorios." });
    }

    const rule = await prisma.serviceConsumptionRule.upsert({
      where: {
        serviceId_productId: { serviceId, productId }
      },
      create: {
        serviceId,
        productId,
        quantity: Number(quantity)
      },
      update: {
        quantity: Number(quantity)
      },
      include: { service: true, product: true }
    });

    return res.status(201).json(rule);
  } catch (error) {
    console.error("Error creating rule:", error);
    return res.status(500).json({ error: "Error configurando regla técnica." });
  }
}

export async function deleteRule(req, res) {
  try {
    const { id } = req.params;
    await prisma.serviceConsumptionRule.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return res.status(500).json({ error: "Error al borrar regla técnica." });
  }
}

// GET /api/inventory/orders & CRUD
export async function listPurchaseOrders(req, res) {
  try {
    const list = await prisma.purchaseOrder.findMany({
      include: { supplier: true, branch: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json(list);
  } catch (error) {
    console.error("Error listing orders:", error);
    return res.status(500).json({ error: "Error listando órdenes de compra." });
  }
}

export async function createPurchaseOrder(req, res) {
  try {
    const { supplierId, branchId, notes, items } = req.body;
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Proveedor e ítems obligatorios." });
    }

    let totalAmount = 0;
    const itemsData = items.map(item => {
      const sub = Number(item.price || 0) * Number(item.quantity || 1);
      totalAmount += sub;
      return {
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price)
      };
    });

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        branchId: branchId || null,
        notes,
        totalAmount,
        status: "DRAFT",
        items: {
          create: itemsData
        }
      },
      include: { supplier: true, items: { include: { product: true } } }
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Error creando orden de compra." });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // "DRAFT" | "SENT" | "CONFIRMED" | "PARTIAL" | "RECEIVED" | "CANCELLED"

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ error: "Orden no encontrada." });

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { supplier: true, items: { include: { product: true } } }
    });

    // If order status is RECEIVED, load actual stock items as new batches (FIFO)
    if (status === "RECEIVED") {
      const branches = await prisma.branch.findMany();
      const firstBranchId = order.branchId || branches[0]?.id || null;

      for (const item of order.items) {
        await prisma.productBatch.create({
          data: {
            productId: item.productId,
            batchNumber: `LOTE-COMPRA-${Math.floor(100 + Math.random() * 900)}`,
            supplierId: order.supplierId,
            initialQty: item.quantity,
            actualQty: item.quantity,
            costPrice: item.price,
            branchId: firstBranchId,
            expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
          }
        });

        // Update product stock
        const prevStock = item.product.stock;
        const newStock = prevStock + item.quantity;
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });

        // Update branch inventory
        if (firstBranchId) {
          const bi = await prisma.branchInventory.findUnique({
            where: { productId_branchId: { productId: item.productId, branchId: firstBranchId } }
          });
          if (bi) {
            await prisma.branchInventory.update({
              where: { id: bi.id },
              data: { stock: bi.stock + item.quantity }
            });
          }
        }

        // Log movement
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            prevQty: prevStock,
            newQty: newStock,
            diff: item.quantity,
            type: "input",
            reason: `Recepción de mercadería: OC-${order.id.slice(-4).toUpperCase()}`,
            branchId: firstBranchId
          }
        });
      }
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Error actualizando estado de orden." });
  }
}
