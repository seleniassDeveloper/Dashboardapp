import BookingForm from "./BookingForm";

export default function BookingPage() {
  return (
    <div style={{ maxWidth: "500px", margin: "40px auto" }}>
      <h1>Reservar cita</h1>
      <BookingForm />
    </div>
  );
}
