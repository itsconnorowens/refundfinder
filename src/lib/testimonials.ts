export interface Testimonial {
  id: string;
  name: string;
  route: string;
  airline: string;
  amount: string;
  timeline: string;
  quote: string;
  verified: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 'sarah-m',
    name: 'Sarah M.',
    route: 'New York → London',
    airline: 'British Airways',
    amount: '€600',
    timeline: '3 weeks',
    quote:
      'Flghtly handled everything while I focused on work. Got my €600 in 3 weeks!',
    verified: true,
  },
  {
    id: 'michael-t',
    name: 'Michael T.',
    route: 'San Francisco → Paris',
    airline: 'Air France',
    amount: '€400',
    timeline: '4 weeks',
    quote:
      'After my 5-hour delay, I thought claiming was too complicated. Flghtly made it effortless.',
    verified: true,
  },
  {
    id: 'jennifer-l',
    name: 'Jennifer L.',
    route: 'Chicago → Frankfurt',
    airline: 'Lufthansa',
    amount: '€250',
    timeline: '2 weeks',
    quote:
      'Family trip ruined by delays, but Flghtly turned it around. Quick and professional service.',
    verified: true,
  },
  {
    id: 'david-k',
    name: 'David K.',
    route: 'Boston → Amsterdam',
    airline: 'KLM',
    amount: '€400',
    timeline: '3 weeks',
    quote:
      'I was skeptical about paying upfront, but the guarantee made it risk-free. Worth every penny.',
    verified: true,
  },
  {
    id: 'maria-r',
    name: 'Maria R.',
    route: 'Los Angeles → Dublin',
    airline: 'Aer Lingus',
    amount: '€600',
    timeline: '5 weeks',
    quote:
      "As a frequent flyer, I've tried other services. Flghtly is by far the most transparent and reliable.",
    verified: true,
  },
];

export const getTestimonialByAmount = (
  amount: string
): Testimonial | undefined => {
  return testimonials.find((t) => t.amount === amount);
};

export const getRandomTestimonial = (): Testimonial => {
  return testimonials[Math.floor(Math.random() * testimonials.length)];
};
