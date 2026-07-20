import Required from "./Required";
import { labelClass } from "./constants";

export default function ContactInfoSection({ form, setField, errors, refs, fieldClass, onPhoneChange }) {
  return (
    <section>
      <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-[#333333]">
        <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">1</span>
        Contact Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First name <Required /></label>
          <input
            ref={refs.firstNameRef}
            type="text" placeholder="First name" value={form.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            className={fieldClass("firstName")}
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className={labelClass}>Last name <Required /></label>
          <input
            ref={refs.lastNameRef}
            type="text" placeholder="Last name" value={form.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            className={fieldClass("lastName")}
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Email <Required /></label>
          <input
            ref={refs.emailRef}
            type="email" placeholder="you@example.com" value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            className={fieldClass("email")}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Phone <Required /></label>
          <input
            ref={refs.phoneRef}
            type="tel" inputMode="tel" placeholder="+92 300 1234567" value={form.phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={fieldClass("phone")}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>
    </section>
  );
}