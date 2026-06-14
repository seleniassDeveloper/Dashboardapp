import OpenAI from "openai";
import prisma from "../prisma.js";

let openaiClient = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function listPosts(req, res) {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio no especificado." });
    }

    const posts = await prisma.marketingPost.findMany({ where: { businessId },
      include: {
        client: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(posts);
  } catch (err) {
    console.error("Error listing marketing posts:", err);
    return res.status(500).json({ error: "Error interno al listar publicaciones de marketing." });
  }
}

export async function createPost(req, res) {
  try {
    const businessId = req.businessId;
    const { clientId, caption, hashtags, cta, format, status, imageUrls, scheduledAt } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio no especificado." });
    }

    if (!format || !imageUrls) {
      return res.status(400).json({ error: "El formato y las imágenes son requeridos." });
    }

    const post = await prisma.marketingPost.create({
      data: {
        businessId,
        clientId: clientId || null,
        caption: caption || "",
        hashtags: hashtags || "",
        cta: cta || "",
        format,
        status: status || "DRAFT",
        imageUrls: imageUrls || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null
      },
      include: {
        client: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return res.status(201).json(post);
  } catch (err) {
    console.error("Error creating marketing post:", err);
    return res.status(500).json({ error: "Error interno al crear la publicación de marketing." });
  }
}

export async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.businessId;
    const { caption, hashtags, cta, status, imageUrls, scheduledAt } = req.body;

    const existing = await prisma.marketingPost.findUnique({
      where: { id }
    });

    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ error: "Publicación no encontrada." });
    }

    const updated = await prisma.marketingPost.update({
      where: { id },
      data: {
        caption: caption !== undefined ? caption : undefined,
        hashtags: hashtags !== undefined ? hashtags : undefined,
        cta: cta !== undefined ? cta : undefined,
        status: status !== undefined ? status : undefined,
        imageUrls: imageUrls !== undefined ? imageUrls : undefined,
        scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : undefined
      },
      include: {
        client: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error updating marketing post:", err);
    return res.status(500).json({ error: "Error interno al actualizar la publicación." });
  }
}

export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    const existing = await prisma.marketingPost.findUnique({
      where: { id }
    });

    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ error: "Publicación no encontrada." });
    }

    await prisma.marketingPost.delete({
      where: { id }
    });

    return res.json({ success: true, message: "Publicación eliminada correctamente." });
  } catch (err) {
    console.error("Error deleting marketing post:", err);
    return res.status(500).json({ error: "Error interno al eliminar la publicación." });
  }
}

export async function generateCaption(req, res) {
  try {
    const { serviceName, rubro, format, cta, tone, lang } = req.body;
    const isEn = lang === "en";
    
    let businessName = "nuestro salón";
    if (req.businessId) {
      const biz = await prisma.business.findUnique({ where: { id: req.businessId } });
      if (biz?.name) {
        businessName = biz.name;
      }
    }

    const promptText = `
Genera un caption creativo y atractivo para una publicación de Instagram.
Detalles:
- Negocio: ${businessName} (Rubro: ${rubro || "Belleza"})
- Servicio realizado: ${serviceName || "Tratamiento"}
- Formato del post: ${format || "Resultado final"}
- Llamado a la acción (CTA): ${cta || "Agenda tu turno"}
- Tono del mensaje: ${tone || "profesional y cálido"}
- Idioma de salida: ${isEn ? "Inglés (English)" : "Español (Spanish)"}

El mensaje debe ser cercano, destacar los resultados del trabajo y la satisfacción.
No agregues placeholders de texto (como "[Nombre]"). Escribe una publicación lista para usar.
Incluye una línea en blanco al final e inserta 4 o 5 hashtags relevantes y populares sobre ${serviceName} y ${rubro}.
    `;

    const client = getOpenAIClient();
    if (client) {
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: promptText }],
          temperature: 0.8,
          max_tokens: 350
        });

        const captionResult = completion.choices[0]?.message?.content?.trim();
        if (captionResult) {
          // Extraer hashtags si los hay, o dividirlos
          const hashtagRegex = /(#[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)/g;
          const matchHashtags = captionResult.match(hashtagRegex);
          let hashtagsStr = "";
          let cleanCaption = captionResult;

          if (matchHashtags && matchHashtags.length > 0) {
            hashtagsStr = matchHashtags.join(" ");
            // Remover los hashtags del final para separarlos
            cleanCaption = captionResult.replace(hashtagRegex, "").trim();
          } else {
            // Generar hashtags por defecto
            hashtagsStr = isEn
              ? `#Beauty #AuraDash #${serviceName?.replace(/\s+/g, "")} #BeforeAndAfter`
              : `#Belleza #AuraDash #${serviceName?.replace(/\s+/g, "")} #AntesYDespues`;
          }

          return res.json({
            caption: cleanCaption,
            hashtags: hashtagsStr
          });
        }
      } catch (aiErr) {
        console.error("OpenAI call failed, running template fallback:", aiErr);
      }
    }

    // Fallback de plantillas de alta fidelidad si no hay OpenAI o falló la llamada
    const fallbackText = getFallbackCaption(serviceName, rubro, format, cta, tone, businessName, isEn);
    return res.json(fallbackText);
  } catch (err) {
    console.error("Error generating marketing caption:", err);
    return res.status(500).json({ error: "Error al generar el pie de foto por IA." });
  }
}

function getFallbackCaption(serviceName, rubro, format, cta, tone, businessName, isEn) {
  const service = serviceName || (isEn ? "treatment" : "tratamiento");
  const biz = businessName || "Aura Studio";

  if (isEn) {
    // English templates
    let text = `Look at this incredible result for the ${service} session done this week at ${biz}! ✨\n\n`;
    if (format === "CAROUSEL_BEFORE_AFTER" || format === "before_after") {
      text += `We worked on a complete transformation focusing on details, personalization, and high-quality techniques to achieve the best result for our client.\n\n`;
    } else {
      text += `We loved doing this treatment, highlighting natural beauty and providing a unique experience. We focus on detail and personalization to make you feel spectacular.\n\n`;
    }
    
    let ctaLine = "";
    if (cta === "WhatsApp" || cta?.toLowerCase().includes("whatsapp")) {
      ctaLine = "Click the link in our bio to write to us directly on WhatsApp and secure your spot! 📲";
    } else if (cta === "Agenda tu turno" || cta?.toLowerCase().includes("book") || cta?.toLowerCase().includes("agenda")) {
      ctaLine = "Would you like similar results? Click the link in our bio to book your appointment online! 🗓️";
    } else {
      ctaLine = "Are you ready to look and feel your best? Send us a DM or message us to request information! 🌸";
    }
    text += ctaLine;

    const serviceTag = service.replace(/\s+/g, "");
    const rubroTag = rubro ? rubro.replace(/\s+/g, "") : "Beauty";
    const hashtags = `#${rubroTag} #${serviceTag} #BeforeAndAfter #AuraStudio #InstagramMarketing`;

    return { caption: text, hashtags };
  } else {
    // Spanish templates
    let text = `¡Miren este increíble resultado para la sesión de ${service} realizada esta semana en ${biz}! ✨\n\n`;
    if (format === "CAROUSEL_BEFORE_AFTER" || format === "before_after") {
      text += `Trabajamos en una transformación completa prestando atención a cada detalle y aplicando técnicas de vanguardia para conseguir un resultado espectacular que resalte lo mejor de nuestra clienta.\n\n`;
    } else {
      text += `Nos encantó realizar este servicio, potenciando la belleza natural y brindando una experiencia única. Cuidamos cada detalle para lograr resultados impecables.\n\n`;
    }
    
    let ctaLine = "";
    if (cta === "WhatsApp" || cta?.toLowerCase().includes("whatsapp")) {
      ctaLine = "¡Escribinos por WhatsApp haciendo clic en el enlace de nuestra biografía para reservar tu lugar! 📲";
    } else if (cta === "Agenda tu turno" || cta?.toLowerCase().includes("agenda")) {
      ctaLine = "¿Te gustaría obtener resultados similares? Agendá tu turno online en el link de nuestro perfil. 🗓️";
    } else {
      ctaLine = "¿Lista para lucir tu mejor versión? Dejanos tu comentario o mandanos un mensaje directo para solicitar info. 🌸";
    }
    text += ctaLine;

    const serviceTag = service.replace(/\s+/g, "");
    const rubroTag = rubro ? rubro.replace(/\s+/g, "") : "Estetica";
    const hashtags = `#${rubroTag} #${serviceTag} #AntesYDespues #AuraStudio #EstiloYBelleza`;

    return { caption: text, hashtags };
  }
}
