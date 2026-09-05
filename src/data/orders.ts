import type { DeliveryStatus } from '@/components/ui';
import type { TimelineStep } from '@/components/ui';

export type OrderItem = { name: string; qty: number; price: string };

export type Order = {
  id: string;
  reference: string;
  status: DeliveryStatus;
  createdAt: string;

  buyer: { name: string; phone: string; email: string };
  address: { line: string; city: string; state: string; landmark?: string };

  items: OrderItem[];
  subtotal: string;
  deliveryFee: string;
  total: string;
  payment: { method: string; status: 'Paid' | 'Pending' | 'Refunded' };

  photo?: string;
  timeline: TimelineStep[];
};

const PHOTO =
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=60';

export const ORDERS: Order[] = [
  {
    id: 'kl-84213',
    reference: '#KL-84213',
    status: 'in_transit',
    createdAt: 'Today · 09:14',
    buyer: { name: 'Amaka Obi', phone: '+234 801 234 5678', email: 'amaka.obi@example.com' },
    address: { line: '12 Adeola Odeku Street', city: 'Victoria Island', state: 'Lagos', landmark: 'Opposite Zenith Bank' },
    items: [
      { name: 'Wireless headphones', qty: 1, price: '₦14,000' },
      { name: 'USB-C cable', qty: 2, price: '₦2,000' },
    ],
    subtotal: '₦16,000',
    deliveryFee: '₦2,500',
    total: '₦18,500',
    payment: { method: 'Card · Visa 4242', status: 'Paid' },
    photo: PHOTO,
    timeline: [
      { title: 'Order created', description: 'Waybill generated', timestamp: '09:14', state: 'done' },
      { title: 'Picked up', description: 'Collected from merchant', timestamp: '10:02', state: 'done' },
      { title: 'In transit', description: 'Out for delivery with rider', timestamp: '11:47', state: 'current' },
      { title: 'Delivered', description: 'Awaiting confirmation', state: 'upcoming' },
    ],
  },
  {
    id: 'kl-84102',
    reference: '#KL-84102',
    status: 'awaiting_pickup',
    createdAt: 'Today · 08:30',
    buyer: { name: 'Tunde Bakare', phone: '+234 802 987 6543', email: 'tunde.b@example.com' },
    address: { line: '4 Herbert Macaulay Way', city: 'Yaba', state: 'Lagos' },
    items: [{ name: 'Bluetooth speaker', qty: 1, price: '₦6,000' }],
    subtotal: '₦6,000',
    deliveryFee: '₦1,200',
    total: '₦7,200',
    payment: { method: 'Bank transfer', status: 'Paid' },
    photo: PHOTO,
    timeline: [
      { title: 'Order created', description: 'Waybill generated', timestamp: '08:30', state: 'done' },
      { title: 'Awaiting pickup', description: 'Ready at the merchant hub', timestamp: '08:45', state: 'current' },
      { title: 'In transit', state: 'upcoming' },
      { title: 'Delivered', state: 'upcoming' },
    ],
  },
  {
    id: 'kl-83994',
    reference: '#KL-83994',
    status: 'delivered',
    createdAt: 'Yesterday · 14:20',
    buyer: { name: 'Grace Eze', phone: '+234 803 555 0199', email: 'grace.eze@example.com' },
    address: { line: '9 Awolowo Road', city: 'Ikoyi', state: 'Lagos' },
    items: [{ name: 'Office chair', qty: 1, price: '₦22,000' }],
    subtotal: '₦22,000',
    deliveryFee: '₦3,000',
    total: '₦25,000',
    payment: { method: 'Card · Mastercard 8821', status: 'Paid' },
    photo: PHOTO,
    timeline: [
      { title: 'Order created', timestamp: '14:20', state: 'done' },
      { title: 'Picked up', timestamp: '15:05', state: 'done' },
      { title: 'In transit', timestamp: '15:30', state: 'done' },
      { title: 'Delivered', description: 'Confirmed by Grace Eze', timestamp: '17:12', state: 'done' },
    ],
  },
  {
    id: 'kl-83870',
    reference: '#KL-83870',
    status: 'cancelled',
    createdAt: 'Yesterday · 11:02',
    buyer: { name: 'Ibrahim Musa', phone: '+234 805 222 8890', email: 'ibrahim.m@example.com' },
    address: { line: '31 Opebi Road', city: 'Ikeja', state: 'Lagos' },
    items: [{ name: 'Standing desk', qty: 1, price: '₦48,000' }],
    subtotal: '₦48,000',
    deliveryFee: '₦4,000',
    total: '₦52,000',
    payment: { method: 'Card · Visa 1109', status: 'Refunded' },
    photo: PHOTO,
    timeline: [
      { title: 'Order created', timestamp: '11:02', state: 'done' },
      { title: 'Picked up', timestamp: '11:40', state: 'done' },
      { title: 'Cancelled', description: 'Recipient unreachable after 3 attempts', timestamp: '16:18', state: 'failed' },
    ],
  },
  {
    id: 'kl-83741',
    reference: '#KL-83741',
    status: 'delivered',
    createdAt: '2 days ago · 10:11',
    buyer: { name: 'Ngozi Okafor', phone: '+234 806 141 2200', email: 'ngozi.o@example.com' },
    address: { line: '7 Bourdillon Road', city: 'Ikoyi', state: 'Lagos' },
    items: [{ name: 'Coffee machine', qty: 1, price: '₦31,000' }],
    subtotal: '₦31,000',
    deliveryFee: '₦2,800',
    total: '₦33,800',
    payment: { method: 'Cash on delivery', status: 'Paid' },
    photo: PHOTO,
    timeline: [
      { title: 'Order created', timestamp: '10:11', state: 'done' },
      { title: 'Picked up', timestamp: '10:52', state: 'done' },
      { title: 'In transit', timestamp: '11:20', state: 'done' },
      { title: 'Delivered', timestamp: '13:04', state: 'done' },
    ],
  },
  {
    id: 'kl-83612',
    reference: '#KL-83612',
    status: 'pending',
    createdAt: '3 days ago · 16:45',
    buyer: { name: 'Chidi Nwosu', phone: '+234 807 333 1177', email: 'chidi.n@example.com' },
    address: { line: '22 Allen Avenue', city: 'Ikeja', state: 'Lagos' },
    items: [{ name: 'Monitor stand', qty: 2, price: '₦9,000' }],
    subtotal: '₦18,000',
    deliveryFee: '₦2,200',
    total: '₦20,200',
    payment: { method: 'Bank transfer', status: 'Pending' },
    photo: PHOTO,
    timeline: [
      { title: 'Order created', timestamp: '16:45', state: 'done' },
      { title: 'Awaiting payment', description: 'Transfer not yet confirmed', state: 'current' },
    ],
  },
];

export function getOrder(id: string) {
  return ORDERS.find((o) => o.id === id);
}

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: 'delivery' | 'payment' | 'system';
  /** Order this notification refers to, when there is one. */
  orderId?: string;
};

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'New delivery assigned', body: 'Order #KL-84213 is ready for pickup in Victoria Island.', time: '2m ago', read: false, kind: 'delivery', orderId: 'kl-84213' },
  { id: 'n2', title: 'Payment confirmed', body: 'Bank transfer for #KL-84102 has been confirmed.', time: '48m ago', read: false, kind: 'payment', orderId: 'kl-84102' },
  { id: 'n3', title: 'Delivery completed', body: 'Grace Eze confirmed delivery of #KL-83994.', time: 'Yesterday', read: true, kind: 'delivery', orderId: 'kl-83994' },
  { id: 'n4', title: 'Route updated', body: 'Traffic on Third Mainland Bridge — an alternate route was suggested.', time: 'Yesterday', read: true, kind: 'system' },
];
