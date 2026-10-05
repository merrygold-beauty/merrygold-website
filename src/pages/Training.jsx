import { useState } from "react";
import SEO from "../components/common/SEO";
import { trainingProgrammes, trainingExperienceLevels } from "../data/training";
import { clinicData } from "../data/clinic";
import { submitEnquiry } from "../services/enquiries";
import HoneypotField from "../components/common/HoneypotField";
import "./Training.css";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  programmes: [],
  experience: trainingExperienceLevels[0],
  notes: "",
  company: ""
};

export default function Training() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("idle"); // idle | sending | success | whatsapp
  const [error, setError] = useState("");

  const toggleProgramme = (name) => {
    setForm((current) => {
      const already = current.programmes.includes(name);
      return {
        ...current,
        programmes: already
          ? current.programmes.filter((item) => item !== name)
          : [...current.programmes, name]
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.programmes.length === 0) {
      setError("Select at least one training programme.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const result = await submitEnquiry({
        type: "training",
        name: form.name,
        email: form.email,
        phone: form.phone,
        programmes: form.programmes,
        experience: form.experience,
        notes: form.notes,
        company: form.company
      });
      setStatus(result.delivered === "email" ? "success" : "whatsapp");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setStatus("idle");
  };

  const isSending = status === "sending";

  return (
    <div className="training-page-shell">
      <SEO
        title="Training Enquiry | MerryGold Beauty Clinic"
        description="Enquire about one-to-one clinic training at MerryGold in Barking, East London: facials, brows, laser, threading, massage, makeup, and semi-permanent makeup."
      />

      <section className="training-hero">
        <div className="container">
          <h1 className="training-page-title">Clinic Training</h1>
          <p className="training-page-subtext">
            One-to-one training with the MerryGold team in the disciplines we practise in clinic. Places are arranged after an enquiry, not booked as a standard treatment.
          </p>
        </div>
      </section>

      <section className="training-body">
        <div className="container training-layout">
          <div className="training-programme-list">
            <h2>Programmes you can ask about</h2>
            <ul>
              {trainingProgrammes.map((programme) => (
                <li key={programme.id}>
                  <h3>{programme.name}</h3>
                  <p>{programme.detail}</p>
                </li>
              ))}
            </ul>
            <p className="training-note">
              Fees, dates, and any entry requirements are confirmed in writing before training starts. Call {clinicData.contact.phone} if you would rather speak first.
            </p>
          </div>

          <div className="training-form-card">
            <h2>Enquiry form</h2>

            {status === "success" && (
              <div className="training-success-box">
                <p>Thank you, {form.name}. Your training enquiry has been sent. We'll reply within one working day with dates and fees.</p>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  <span>Send another</span>
                </button>
              </div>
            )}

            {status === "whatsapp" && (
              <div className="training-success-box">
                <p>Email isn't available right now, so we've opened WhatsApp with your message ready to send.</p>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  <span>Send another</span>
                </button>
              </div>
            )}

            {(status === "idle" || status === "sending") && (
              <>
                <p>We'll reply by email or phone within one working day.</p>

                <form className="training-form" onSubmit={handleSubmit}>
                  <div className="training-field">
                    <label htmlFor="train-name">Full name *</label>
                    <input
                      id="train-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </div>

                  <div className="training-field">
                    <label htmlFor="train-email">Email *</label>
                    <input
                      id="train-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                    />
                  </div>

                  <div className="training-field">
                    <label htmlFor="train-phone">Telephone *</label>
                    <input
                      id="train-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    />
                  </div>

                  <fieldset className="training-field">
                    <legend>Programmes *</legend>
                    {trainingProgrammes.map((programme) => (
                      <label key={programme.id} className="training-check">
                        <input
                          type="checkbox"
                          checked={form.programmes.includes(programme.name)}
                          onChange={() => toggleProgramme(programme.name)}
                        />
                        <span>{programme.name}</span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="training-field">
                    <label htmlFor="train-experience">Experience</label>
                    <select
                      id="train-experience"
                      value={form.experience}
                      onChange={(event) => setForm({ ...form, experience: event.target.value })}
                    >
                      {trainingExperienceLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div className="training-field">
                    <label htmlFor="train-notes">Notes</label>
                    <textarea
                      id="train-notes"
                      rows={4}
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      placeholder="Dates you can attend, qualifications held, or questions."
                    />
                  </div>

                  <HoneypotField
                    id="train-company"
                    value={form.company}
                    onChange={(event) => setForm({ ...form, company: event.target.value })}
                  />

                  {error ? <p className="training-error" role="alert">{error}</p> : null}

                  <button type="submit" className="btn btn-primary" disabled={isSending}>
                    <span>{isSending ? "Sending" : "Send enquiry"}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
