// A honeypot trap shared by every enquiry form (contact, consultation,
// training): real visitors never see or reach this field, so a submission
// that fills it in came from a bot filling in every field, not a person.
// Off-screen, not display:none. That is deliberate: a scripted form-filler
// that ignores CSS visibility would still trip this, which is the whole
// point of a honeypot. Real visitors never tab to it or see it.
const honeypotStyle = { position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' };

export default function HoneypotField({ id, value, onChange }) {
  return (
    <input
      id={id}
      type="text"
      name="company"
      value={value}
      onChange={onChange}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={honeypotStyle}
    />
  );
}
