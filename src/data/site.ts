/**
 * Company content mirrored from koollogistiks.com so the app and the website
 * say the same thing. Update here when the site copy changes.
 */

export const Company = {
  name: 'Kool Logistics',
  phone: '+234 707 907 4021',
  phoneDial: '+2347079074021',
  email: 'Logistics@koolboks.com',
  address: '1 Ambassador Street, Agric Road, Igando, Lagos',
  hours: 'Mon–Fri 8:00–18:00 · Sat 9:00–15:00',
  website: 'https://koollogistiks.com',
} as const;

export const ValueProps = [
  { title: 'Zero headache logistics', body: 'No drivers to manage, no fleet overheads.' },
  { title: 'Your fleet on demand', body: 'Bikes, vans, cars and trucks — always ready to roll.' },
  { title: 'Live GPS tracking', body: 'See every move, in real time.' },
  { title: 'Flexible plans', body: 'Daily runs, weekly schedules, or fully custom plans.' },
  { title: 'Pro riders & drivers', body: 'Courteous, uniformed professionals who represent your brand.' },
] as const;

export const Fleet = [
  { key: 'bike', name: 'Delivery Bikes', body: 'Quick city deliveries and urgent packages.' },
  { key: 'car', name: 'Delivery Cars', body: 'Medium packages and document deliveries.' },
  { key: 'van', name: 'Delivery Vans', body: 'Bulk deliveries and larger items.' },
  { key: 'truck', name: 'Delivery Trucks', body: 'Heavy cargo and long-distance routes.' },
] as const;

export const Faqs = [
  {
    q: 'How do I track my shipment?',
    a: 'Open Track, enter your waybill or reference number, and you will see the live status of your cargo anywhere in Nigeria.',
  },
  {
    q: 'What services does Kool Logistics offer?',
    a: 'Freight forwarding, international shipping, cargo delivery, warehousing, distribution, supply chain management and courier services across Lagos, Nigeria and West Africa.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Within Lagos: same day to 1 business day. To major cities such as Abuja, Port Harcourt and Kano: 2–5 business days. International: 5–15 business days depending on destination.',
  },
  {
    q: 'Do you offer door-to-door delivery?',
    a: 'Yes. We pick up from your location and deliver directly to the recipient, with full tracking and insurance cover throughout.',
  },
  {
    q: 'How are rates calculated?',
    a: 'Rates depend on weight, dimensions, destination and service speed. Contact the team for a free quote — there are no hidden fees.',
  },
  {
    q: 'Do you handle international shipping?',
    a: 'Yes. We ship from Lagos worldwide, including the USA, UK, Europe, Asia and across Africa, and we handle customs clearance and documentation.',
  },
] as const;

export const Stats = [
  { value: '100,000+', label: 'Packages delivered' },
  { value: '99%', label: 'On-time delivery' },
  { value: '50+', label: 'Businesses served' },
] as const;
