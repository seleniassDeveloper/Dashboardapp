import prisma from "../prisma.js";

export async function getClientCRMProfile(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "El ID del cliente es obligatorio." });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            service: true,
            worker: true,
            photos: true,
            clinicalNotes: true,
          },
          orderBy: { startsAt: "desc" },
        },
        clinicalNotes: {
          include: {
            worker: true,
            appointment: {
              include: {
                service: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
        },
        appointmentPhotos: {
          orderBy: { createdAt: "desc" },
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    const appointments = client.appointments;
    const completedAppointments = appointments.filter(a => a.status === "DONE");
    const totalVisits = completedAppointments.length;
    const totalSpent = completedAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    const upcomingAppointments = appointments.filter(
      a => new Date(a.startsAt) > new Date() && (a.status === "PENDING" || a.status === "CONFIRMED")
    );

    // Smart loyalty status
    let loyaltyStatus = "NUEVO";
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const hasRecentVisit = completedAppointments.some(a => new Date(a.startsAt) >= thirtyDaysAgo);
    const hasNoRecentVisit60 = completedAppointments.every(a => new Date(a.startsAt) < sixtyDaysAgo);

    if (totalVisits >= 5 && totalSpent >= 50000) {
      loyaltyStatus = "VIP";
    } else if (hasRecentVisit || upcomingAppointments.length > 0) {
      loyaltyStatus = "ACTIVO";
    } else if (totalVisits > 0 && hasNoRecentVisit60) {
      loyaltyStatus = "INACTIVO";
    } else if (totalVisits === 0) {
      loyaltyStatus = "NUEVO";
    } else {
      loyaltyStatus = "ACTIVO";
    }

    // Average Ticket
    const avgTicket = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;

    // Visit Frequency
    let visitFrequencyDays = 0;
    if (totalVisits > 1) {
      const sortedCompleted = [...completedAppointments].sort(
        (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
      );
      let totalDiffTime = 0;
      for (let i = 1; i < sortedCompleted.length; i++) {
        const diff = new Date(sortedCompleted[i].startsAt) - new Date(sortedCompleted[i - 1].startsAt);
        totalDiffTime += diff;
      }
      const avgDiffMs = totalDiffTime / (sortedCompleted.length - 1);
      visitFrequencyDays = Math.round(avgDiffMs / (1000 * 60 * 60 * 24));
    }

    // Favorite Professional
    const workerCounts = {};
    completedAppointments.forEach(a => {
      if (a.worker) {
        const name = `${a.worker.firstName} ${a.worker.lastName}`;
        workerCounts[name] = (workerCounts[name] || 0) + 1;
      }
    });
    let favoriteProfessional = "Ninguno";
    let maxWorkerCount = 0;
    Object.entries(workerCounts).forEach(([name, count]) => {
      if (count > maxWorkerCount) {
        maxWorkerCount = count;
        favoriteProfessional = name;
      }
    });

    // Favorite Service
    const serviceCounts = {};
    completedAppointments.forEach(a => {
      if (a.service) {
        const name = a.service.name;
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      }
    });
    let favoriteService = "Ninguno";
    let maxServiceCount = 0;
    Object.entries(serviceCounts).forEach(([name, count]) => {
      if (count > maxServiceCount) {
        maxServiceCount = count;
        favoriteService = name;
      }
    });

    // Retention Index
    let retentionIndex = 0;
    if (loyaltyStatus === "VIP") {
      retentionIndex = 100;
    } else if (loyaltyStatus === "ACTIVO") {
      retentionIndex = Math.min(95, 50 + totalVisits * 10);
    } else if (loyaltyStatus === "NUEVO") {
      retentionIndex = 50;
    } else if (loyaltyStatus === "INACTIVO") {
      retentionIndex = Math.max(10, 30 - (completedAppointments.length ? 5 : 20));
    }

    // Days Since Last Visit
    let daysSinceLastVisit = null;
    if (totalVisits > 0) {
      const latestVisit = completedAppointments.reduce((latest, a) => {
        const date = new Date(a.startsAt);
        return date > latest ? date : latest;
      }, new Date(0));
      const diffTime = Math.abs(now - latestVisit);
      daysSinceLastVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Build timeline events
    const timeline = [];

    // 1. Client Creation Event
    timeline.push({
      id: `creation-${client.id}`,
      type: "creation",
      date: client.createdAt,
      title: "Registro de Cliente",
      description: "El cliente fue registrado en la base de datos.",
      metadata: {}
    });

    // 2. Appointment Events
    appointments.forEach(a => {
      timeline.push({
        id: `appointment-${a.id}`,
        type: "appointment",
        date: a.startsAt,
        title: `Cita: ${a.service?.name || "Servicio General"}`,
        description: `Servicio con ${a.worker ? `${a.worker.firstName} ${a.worker.lastName}` : "estilista"}.`,
        status: a.status,
        metadata: {
          appointmentId: a.id,
          serviceName: a.service?.name,
          workerName: a.worker ? `${a.worker.firstName} ${a.worker.lastName}` : "General",
          price: a.service?.price || 0,
          notes: a.notes,
        }
      });
    });

    // 3. Clinical Notes Events
    client.clinicalNotes.forEach(cn => {
      timeline.push({
        id: `clinical-note-${cn.id}`,
        type: "clinical_note",
        date: cn.createdAt,
        title: "Evolución Clínica / Ficha Técnica",
        description: cn.note,
        metadata: {
          clinicalNoteId: cn.id,
          recommendations: cn.recommendations,
          workerName: cn.worker ? `${cn.worker.firstName} ${cn.worker.lastName}` : "Profesional",
          appointmentId: cn.appointmentId,
          serviceName: cn.appointment?.service?.name || "Tratamiento",
        }
      });
    });

    // 4. Photos Events (Photos are grouped or shown individually. Let's show before/after comparison if they belong to the same appointment, or individual ones)
    // We can group photos by appointment or show them individually.
    // Let's group photos by appointmentId to display them beautifully together as a "photo_session"
    const photosByAppointment = {};
    client.appointmentPhotos.forEach(p => {
      if (!photosByAppointment[p.appointmentId]) {
        photosByAppointment[p.appointmentId] = [];
      }
      photosByAppointment[p.appointmentId].push(p);
    });

    Object.entries(photosByAppointment).forEach(([apptId, photos]) => {
      const appt = appointments.find(a => a.id === apptId);
      const apptDate = appt ? appt.startsAt : (photos[0]?.createdAt || now);
      timeline.push({
        id: `photos-session-${apptId}`,
        type: "photos_session",
        date: apptDate,
        title: "Galería de Tratamiento (Antes/Después)",
        description: `Registro visual para el servicio de ${appt?.service?.name || "Estética"}.`,
        metadata: {
          appointmentId: apptId,
          serviceName: appt?.service?.name,
          photos: photos.map(p => ({
            id: p.id,
            type: p.type, // "before" | "after"
            imageUrl: p.imageUrl,
            createdAt: p.createdAt
          }))
        }
      });
    });
    // Sort timeline descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Validaciones de seguridad para protección de campos sensibles
    const userRole = req.user?.role || "";
    const userPermissions = req.user?.permissions || [];

    const hasPrivateNotesView = userRole === "owner" || userPermissions.includes("clients.privateNotes.view");
    const hasFinancialHistoryView = userRole === "owner" || userPermissions.includes("clients.financialHistory.view");

    // Filtrar timeline (remover notas clínicas si no tiene permiso)
    const filteredTimeline = timeline.filter(item => {
      if (item.type === "clinical_note") return hasPrivateNotesView;
      return true;
    });

    // Response profile
    const profile = {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
        createdAt: client.createdAt,
      },
      metrics: {
        loyaltyStatus,
        totalVisits,
        totalSpent: hasFinancialHistoryView ? totalSpent : null,
        avgTicket: hasFinancialHistoryView ? avgTicket : null,
        visitFrequencyDays,
        favoriteProfessional,
        favoriteService,
        retentionIndex,
        daysSinceLastVisit,
        upcomingVisitsCount: upcomingAppointments.length,
      },
      timeline: filteredTimeline,
      clinicalHistory: hasPrivateNotesView ? client.clinicalNotes : [],
      gallery: client.appointmentPhotos,
    };

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Error en perfil CRM:", error);
    return res.status(500).json({
      error: "Error obteniendo perfil CRM del cliente.",
      detail: error?.message || "Unknown error",
    });
  }
}
